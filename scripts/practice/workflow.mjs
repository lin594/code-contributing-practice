#!/usr/bin/env node
import fs from "node:fs";
import {
  COMPLETION_MARKER,
  EXERCISE_LABELS,
  FEEDBACK_MARKER,
  SCHEMA_VERSION,
  SESSION_FILE,
  SESSION_MARKER,
  WORKSPACE_FILE,
} from "./constants.mjs";
import { parseFeedbackState, renderFeedback, replaceFeedbackState } from "./feedback.mjs";
import { closingIssueNumbers, gradePractice, hasCurrentCiVerification, maintenanceReport } from "./grade.mjs";
import { GitHubApiError, GitHubClient } from "./github.mjs";
import { assertMergeEligible, canInjectUpstream, expiryDecision, hasBlockingReview } from "./lifecycle.mjs";
import { formatGitHubAnnotations, formatLinkFailures, validateMarkdownLinks } from "./markdown-links.mjs";
import {
  createManifest,
  exerciseFromLabels,
  issueInstructions,
  parseSessionBranch,
  sessionFiles,
  shouldHandleIssueEvent,
  shouldSkipGradeEvent,
  upstreamMutation,
} from "./session.mjs";

function loadEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) throw new Error("GITHUB_EVENT_PATH is required");
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function clientFromEnv() {
  return new GitHubClient({ token: process.env.GITHUB_TOKEN, repository: process.env.GITHUB_REPOSITORY });
}

function repositoryUrl() {
  return `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${process.env.GITHUB_REPOSITORY}`;
}

function writeOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const safe = Object.entries(values).map(([key, value]) => `${key}=${String(value).replaceAll("\n", "")}`).join("\n");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${safe}\n`);
}

function writeSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

function normalizePr(pr) {
  return {
    number: pr.number,
    title: pr.title ?? "",
    body: pr.body ?? "",
    author: pr.user.login,
    baseRef: pr.base.ref,
    headRef: pr.head.ref,
    headSha: pr.head.sha,
    headRepository: pr.head.repo?.full_name,
    draft: Boolean(pr.draft),
    labels: pr.labels ?? [],
    state: pr.state,
    merged: Boolean(pr.merged),
  };
}

function normalizeIssue(issue) {
  return {
    number: issue.number,
    author: issue.user.login,
    assignees: issue.assignees.map((user) => user.login),
    labels: issue.labels,
    state: issue.state,
  };
}

async function replaceSessionState(client, manifest, changes) {
  const updated = { ...manifest, ...changes };
  await client.commitFiles(manifest.baseBranch, { [SESSION_FILE]: `${JSON.stringify(updated, null, 2)}\n` }, `chore(practice): update exercise ${manifest.exercise} session`);
  return updated;
}

async function injectUpstream(client, manifest) {
  const mutation = upstreamMutation(manifest.exercise);
  if (!mutation || manifest.upstreamBaseSha) return manifest;
  const current = await client.getContent(WORKSPACE_FILE, manifest.baseBranch);
  if (!current.includes(mutation.before)) throw new Error(`Exercise ${manifest.exercise} base workspace is not in the expected initial state`);
  const changed = current.replace(mutation.before, mutation.after);
  const upstreamCommit = await client.commitFiles(manifest.baseBranch, { [WORKSPACE_FILE]: changed }, mutation.message);
  return replaceSessionState(client, manifest, { state: "upstream-injected", upstreamBaseSha: upstreamCommit.sha });
}

async function prerequisiteComplete(client, actor, exercise) {
  if (exercise === 1) return true;
  const labelQuery = encodeURIComponent(`${EXERCISE_LABELS.get(exercise - 1)},session:completed`);
  const issues = await client.paginate(client.repoPath(`/issues?state=closed&creator=${encodeURIComponent(actor)}&labels=${labelQuery}`));
  for (const issue of issues.filter((item) => !item.pull_request)) {
    const comments = await client.paginate(client.repoPath(`/issues/${issue.number}/comments`));
    if (comments.some((comment) => comment.user?.type === "Bot" && comment.body?.includes(COMPLETION_MARKER))) return true;
  }
  return false;
}

async function handleIssueOpened() {
  const event = loadEvent();
  if (!shouldHandleIssueEvent(event)) return;
  const issue = event.issue;
  const exercise = exerciseFromLabels(issue.labels);
  if (!exercise) return;
  const client = clientFromEnv();
  const actor = issue.user.login;
  const statusLabels = issue.labels.map((label) => label.name).filter((name) => name.startsWith("session:"));
  if (statusLabels.some((name) => ["session:completed", "session:expired"].includes(name))) {
    await client.upsertComment(issue.number, SESSION_MARKER, `<!-- ${SESSION_MARKER} -->\n这个会话已经${statusLabels.includes("session:completed") ? "完成" : "过期"}，请使用 Issue Form 新建练习会话。\n`);
    await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
    return;
  }
  if (!(await prerequisiteComplete(client, actor, exercise))) {
    await client.patch(client.repoPath(`/issues/${issue.number}`), { assignees: [actor] });
    await client.setStatusLabel(issue.number, "session:blocked");
    await client.upsertComment(issue.number, SESSION_MARKER, `<!-- ${SESSION_MARKER} -->\n## 前置练习尚未完成\n\n请先完成当前课程版本的练习 ${exercise - 1}。完成后重新打开本 Issue，机器人会再次检查。\n`);
    await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
    return;
  }

  const labelQuery = encodeURIComponent(`${EXERCISE_LABELS.get(exercise)},session:active`);
  const activeIssues = await client.paginate(client.repoPath(`/issues?state=open&creator=${encodeURIComponent(actor)}&labels=${labelQuery}`));
  const duplicate = activeIssues.find((item) => !item.pull_request && item.number !== issue.number);
  if (duplicate) {
    await client.patch(client.repoPath(`/issues/${issue.number}`), { assignees: [actor] });
    await client.setStatusLabel(issue.number, "session:blocked");
    await client.upsertComment(issue.number, SESSION_MARKER, `<!-- ${SESSION_MARKER} -->\n## 已有进行中的同关练习\n\n请先继续 Issue #${duplicate.number}。为避免创建重复分支，本 Issue 已关闭。\n`);
    await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
    return;
  }

  const manifest = createManifest({ exercise, issueNumber: issue.number, actor });
  let exists = false;
  try {
    await client.getRef(manifest.baseBranch);
    exists = true;
  } catch (error) {
    if (!(error instanceof GitHubApiError) || error.status !== 404) throw error;
  }
  if (!exists) {
    const repo = await client.get(client.repoPath(""));
    const source = await client.getRef(repo.default_branch);
    await client.createRef(manifest.baseBranch, source.object.sha);
    await client.commitFiles(manifest.baseBranch, sessionFiles(manifest), `chore(practice): start exercise ${exercise} for issue ${issue.number}`);
  } else {
    try {
      JSON.parse(await client.getContent(SESSION_FILE, manifest.baseBranch));
      await client.getContent(WORKSPACE_FILE, manifest.baseBranch);
    } catch (error) {
      if (!(error instanceof GitHubApiError) || error.status !== 404) throw error;
      await client.commitFiles(manifest.baseBranch, sessionFiles(manifest), `chore(practice): repair exercise ${exercise} session`);
    }
  }
  await client.patch(client.repoPath(`/issues/${issue.number}`), { assignees: [actor] });
  await client.setStatusLabel(issue.number, "session:active");
  await client.upsertComment(issue.number, SESSION_MARKER, issueInstructions({ manifest, repositoryUrl: repositoryUrl() }));
}

async function latestReviewsBlock(client, prNumber) {
  const reviews = await client.paginate(client.repoPath(`/pulls/${prNumber}/reviews`));
  return hasBlockingReview(reviews);
}

async function upstreamBaseIncluded(client, manifest, pr) {
  if (!manifest.upstreamBaseSha) return false;
  const head = `${pr.head.repo.owner.login}:${pr.head.ref}`;
  try {
    const compare = await client.get(client.repoPath(`/compare/${encodeURIComponent(manifest.upstreamBaseSha)}...${encodeURIComponent(head)}`));
    return compare.status === "ahead" || compare.status === "identical";
  } catch (error) {
    if (error instanceof GitHubApiError && [404, 422].includes(error.status)) return false;
    throw error;
  }
}

async function remoteCiLabResult(client, rawPr, workspace) {
  return validateMarkdownLinks({
    sourcePath: WORKSPACE_FILE,
    content: workspace,
    exists: async (target) => {
      try {
        await client.getContent(target, rawPr.head.sha, rawPr.head.repo.full_name);
        return true;
      } catch (error) {
        if (error instanceof GitHubApiError && error.status === 404) return false;
        throw error;
      }
    },
  });
}

async function collectPracticeInput(client, rawPr, manifest, feedbackComment) {
  const [rawIssue, files, rawCommits, comments, humanChangesRequested, workspace] = await Promise.all([
    client.get(client.repoPath(`/issues/${manifest.issueNumber}`)),
    client.paginate(client.repoPath(`/pulls/${rawPr.number}/files`)),
    client.paginate(client.repoPath(`/pulls/${rawPr.number}/commits`)),
    client.paginate(client.repoPath(`/issues/${rawPr.number}/comments`)),
    latestReviewsBlock(client, rawPr.number),
    client.getContent(WORKSPACE_FILE, rawPr.head.sha, rawPr.head.repo.full_name),
  ]);
  const feedbackState = parseFeedbackState(feedbackComment?.body ?? "");
  const requestedAt = feedbackState.revisionRequestedAt ? Date.parse(feedbackState.revisionRequestedAt) : Infinity;
  const authorResponded = comments.some((comment) => comment.user?.login === manifest.actor && Date.parse(comment.created_at) > requestedAt);
  const commitWorkspaces = manifest.exercise === 2
    ? await Promise.all(rawCommits.map(async (commit) => {
        try {
          return await client.getContent(WORKSPACE_FILE, commit.sha, rawPr.head.repo.full_name);
        } catch (error) {
          if (error instanceof GitHubApiError && error.status === 404) return "";
          throw error;
        }
      }))
    : [];
  const ciLab = manifest.exercise === 9 ? await remoteCiLabResult(client, rawPr, workspace) : null;
  const normalizedComments = comments.map((comment) => ({
    author: comment.user?.login ?? "",
    body: comment.body ?? "",
    createdAt: comment.created_at,
  }));
  return {
    pr: normalizePr(rawPr),
    session: manifest,
    issue: normalizeIssue(rawIssue),
    files: files.map((file) => ({ filename: file.filename, status: file.status, changes: file.changes })),
    commits: rawCommits.map((commit) => ({ sha: commit.sha, message: commit.commit.message, parents: commit.parents })),
    commitWorkspaces,
    workspace,
    feedbackState,
    authorResponded,
    humanChangesRequested,
    upstreamBaseIncluded: [6, 7, 8].includes(manifest.exercise) ? await upstreamBaseIncluded(client, manifest, rawPr) : false,
    ciLab,
    ciCheckPassed: manifest.exercise === 9 && feedbackState.ciPassedSha === rawPr.head.sha,
    authorCiVerified: manifest.exercise === 9 && hasCurrentCiVerification({
      comments: normalizedComments,
      actor: manifest.actor,
      headSha: rawPr.head.sha,
      verifiedAfter: feedbackState.ciPassedAt,
    }),
  };
}

async function evaluatePullRequest(client, prNumber, { updateFeedback = true } = {}) {
  let rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  const parsedBranch = parseSessionBranch(rawPr.base.ref);
  const comments = await client.paginate(client.repoPath(`/issues/${prNumber}/comments`));
  const feedbackComment = comments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes(FEEDBACK_MARKER));

  if (!parsedBranch) {
    const rawCommits = await client.paginate(client.repoPath(`/pulls/${prNumber}/commits`));
    const report = maintenanceReport(normalizePr(rawPr), rawCommits.map((commit) => ({ message: commit.commit.message })));
    if (updateFeedback) await client.upsertComment(prNumber, FEEDBACK_MARKER, renderFeedback(report));
    return { report, input: null };
  }

  let manifest;
  try {
    manifest = JSON.parse(await client.getContent(SESSION_FILE, rawPr.base.ref));
  } catch (error) {
    const report = {
      schemaVersion: 1,
      outcome: "fail",
      headSha: rawPr.head.sha,
      session: { ...parsedBranch, baseBranch: rawPr.base.ref },
      results: [{ id: "session.load", level: "required", status: "fail", summary: "无法读取可信会话清单。", remediation: "回到练习 Issue 重新创建会话。" }],
      warnings: 0,
      nextActions: ["请联系维护者检查训练分支。"],
    };
    if (updateFeedback) await client.upsertComment(prNumber, FEEDBACK_MARKER, renderFeedback(report));
    return { report, input: null };
  }

  if (canInjectUpstream({ pr: rawPr, manifest, referencedIssues: closingIssueNumbers(rawPr.body ?? "") })) {
    manifest = await injectUpstream(client, manifest);
    rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  }

  const input = await collectPracticeInput(client, rawPr, manifest, feedbackComment);
  const report = gradePractice(input);
  const state = { ...input.feedbackState };
  if (manifest.exercise === 4 && rawPr.draft && !state.draftObservedAt) {
    state.draftObservedAt = new Date().toISOString();
  }
  if ([5, 8].includes(manifest.exercise) && !state.revisionRequestedSha) {
    state.revisionRequestedSha = rawPr.head.sha;
    state.revisionRequestedAt = new Date().toISOString();
  }
  if (manifest.exercise === 9 && !input.ciLab?.ok && !state.ciFailureObservedSha) {
    state.ciFailureObservedSha = rawPr.head.sha;
    state.ciFailureObservedAt = new Date().toISOString();
  }
  if (updateFeedback) {
    await client.upsertComment(prNumber, FEEDBACK_MARKER, renderFeedback(report, state));
    await client.setStatusLabel(prNumber, report.outcome === "pass" ? "session:ready" : "session:needs-fix");
  }
  return { report, input };
}

async function handleGradePr() {
  const event = loadEvent();
  if (shouldSkipGradeEvent(event)) {
    writeOutput({ eligible: false, outcome: "skipped", head_sha: event.pull_request?.head?.sha ?? "", pr_number: event.pull_request?.number ?? "" });
    return;
  }
  const prNumber = event.pull_request?.number ?? event.issue?.number;
  if (!prNumber) throw new Error("This event does not identify a pull request");
  const client = clientFromEnv();
  const { report, input } = await evaluatePullRequest(client, prNumber);
  const eligible = report.outcome === "pass" && Boolean(input?.session);
  writeOutput({ eligible, outcome: report.outcome, head_sha: report.headSha, pr_number: prNumber, issue_number: input?.session.issueNumber ?? "", base_branch: input?.session.baseBranch ?? "" });
  writeSummary(renderFeedback(report, input?.feedbackState ?? {}));
}

async function handleCiLabPr() {
  const event = loadEvent();
  const prNumber = event.pull_request?.number ?? event.issue?.number;
  if (!prNumber) throw new Error("This event does not identify a pull request");
  const client = clientFromEnv();
  const rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  if (event.pull_request?.head?.sha !== rawPr.head.sha) throw new Error("PR head changed while the CI lab was running");
  const session = parseSessionBranch(rawPr.base.ref);
  if (session?.exercise !== 9) throw new Error("CI lab can only run for exercise 9");
  const workspace = await client.getContent(WORKSPACE_FILE, rawPr.head.sha, rawPr.head.repo.full_name);
  const result = await remoteCiLabResult(client, rawPr, workspace);
  if (!result.ok) {
    console.log(formatGitHubAnnotations(result));
    console.error(formatLinkFailures(result));
    console.error("\nReproduce locally: npm run check:ci-lab");
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${WORKSPACE_FILE} — all local Markdown links resolve to files.`);
}

async function handleRecordCiLabPass() {
  const event = loadEvent();
  const prNumber = event.pull_request?.number;
  const expectedHead = event.pull_request?.head?.sha;
  if (!prNumber || !expectedHead) throw new Error("A pull_request_target event is required");
  const client = clientFromEnv();
  const rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  if (rawPr.head.sha !== expectedHead) throw new Error("PR head changed before the CI result was recorded");
  const session = parseSessionBranch(rawPr.base.ref);
  if (session?.exercise !== 9) throw new Error("CI lab can only record exercise 9");
  const workspace = await client.getContent(WORKSPACE_FILE, expectedHead, rawPr.head.repo.full_name);
  const result = await remoteCiLabResult(client, rawPr, workspace);
  if (!result.ok) throw new Error("Cannot record a passing SHA for a failing CI lab");
  const comments = await client.paginate(client.repoPath(`/issues/${prNumber}/comments`));
  const feedback = comments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes(FEEDBACK_MARKER));
  if (!feedback) throw new Error("Practice feedback must exist before recording the CI result");
  const state = parseFeedbackState(feedback.body);
  if (!state.ciFailureObservedSha) throw new Error("The planned CI failure must be observed before a passing SHA is recorded");
  const updated = { ...state, ciPassedSha: expectedHead, ciPassedAt: new Date().toISOString() };
  await client.patch(client.repoPath(`/issues/comments/${feedback.id}`), { body: replaceFeedbackState(feedback.body, updated) });
  console.log(`Recorded passing CI evidence for head ${expectedHead.slice(0, 12)}.`);
}

async function handleMergePr() {
  const prNumber = Number(process.env.PR_NUMBER);
  const expectedHead = process.env.EXPECTED_HEAD;
  if (!Number.isInteger(prNumber) || !expectedHead) throw new Error("PR_NUMBER and EXPECTED_HEAD are required");
  const client = clientFromEnv();
  const rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  if (rawPr.merged) {
    const parsed = parseSessionBranch(rawPr.base.ref);
    if (!parsed) return;
    let manifest = { ...parsed, baseBranch: rawPr.base.ref };
    try {
      manifest = JSON.parse(await client.getContent(SESSION_FILE, rawPr.base.ref));
    } catch (error) {
      if (!(error instanceof GitHubApiError) || error.status !== 404) throw error;
    }
    await finalizeSession(client, { manifest, prNumber });
    return;
  }
  const { report, input } = await evaluatePullRequest(client, prNumber, { updateFeedback: false });
  assertMergeEligible({ report, input, expectedHead });

  const merged = await client.put(client.repoPath(`/pulls/${prNumber}/merge`), {
    merge_method: "squash",
    sha: expectedHead,
    commit_title: `chore(practice): complete exercise ${input.session.exercise} for ${input.session.actor}`,
  });
  if (!merged.merged) throw new Error(`GitHub refused the merge: ${merged.message ?? "unknown reason"}`);

  await finalizeSession(client, { manifest: input.session, prNumber });
}

async function finalizeSession(client, { manifest, prNumber }) {
  await client.deleteRef(manifest.baseBranch);
  const prComments = await client.paginate(client.repoPath(`/issues/${prNumber}/comments`));
  const feedback = prComments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes(FEEDBACK_MARKER));
  if (!feedback?.body?.includes("已自动 squash merge")) {
    const completion = "\n\n✅ 已自动 squash merge；训练分支和 Issue 已清理。\n";
    if (feedback) await client.patch(client.repoPath(`/issues/comments/${feedback.id}`), { body: `${feedback.body}${completion}` });
    else await client.post(client.repoPath(`/issues/${prNumber}/comments`), { body: `<!-- ${FEEDBACK_MARKER}:e30 -->\n## 🤖 练习自动反馈\n${completion}` });
  }
  await client.upsertComment(manifest.issueNumber, COMPLETION_MARKER, `<!-- ${COMPLETION_MARKER} -->\n## 🎉 练习 ${manifest.exercise} 完成\n\nPR #${prNumber} 已合并，专属训练分支已清理。${manifest.exercise < 9 ? ` 现在可以开始练习 ${manifest.exercise + 1}。` : " 你已经完成核心训练，可以把这套流程迁移到课程小组或真实开源仓库。"}\n`);
  await client.setStatusLabel(manifest.issueNumber, "session:completed");
  await client.patch(client.repoPath(`/issues/${manifest.issueNumber}`), { state: "closed", state_reason: "completed" });
}

async function lastLearnerActivity(client, issue, pulls) {
  const dates = [issue.created_at];
  const issueComments = await client.paginate(client.repoPath(`/issues/${issue.number}/comments`));
  dates.push(...issueComments.filter((comment) => comment.user?.type !== "Bot").map((comment) => comment.created_at));
  for (const pr of pulls) {
    dates.push(pr.created_at, pr.updated_at);
    const comments = await client.paginate(client.repoPath(`/issues/${pr.number}/comments`));
    dates.push(...comments.filter((comment) => comment.user?.type !== "Bot").map((comment) => comment.created_at));
  }
  return dates.sort().at(-1);
}

async function handleCleanup() {
  const client = clientFromEnv();
  const issues = await client.paginate(client.repoPath(`/issues?state=open&labels=${encodeURIComponent("session:active")}`));
  for (const issue of issues.filter((item) => !item.pull_request)) {
    const exercise = exerciseFromLabels(issue.labels);
    if (!exercise) continue;
    const branch = `practice/ex${exercise}/issue-${issue.number}-${issue.user.login}`;
    const pulls = await client.paginate(client.repoPath(`/pulls?state=open&base=${encodeURIComponent(branch)}`));
    const expiry = expiryDecision(await lastLearnerActivity(client, issue, pulls));
    if (expiry.action === "expire") {
      for (const pr of pulls) {
        await client.post(client.repoPath(`/issues/${pr.number}/comments`), { body: "此练习会话已连续 14 天无活动，机器人正在关闭 PR 并清理临时分支。需要继续时请重新创建练习 Issue。" });
        await client.patch(client.repoPath(`/pulls/${pr.number}`), { state: "closed" });
      }
      await client.post(client.repoPath(`/issues/${issue.number}/comments`), { body: "此会话已过期并完成清理。你可以随时通过 Issue Form 重新开始。" });
      await client.deleteRef(branch);
      await client.setStatusLabel(issue.number, "session:expired");
      await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
    } else if (expiry.action === "remind") {
      await client.upsertComment(issue.number, "practice-expiry-warning:v1", "<!-- practice-expiry-warning:v1 -->\n## ⏰ 会话即将过期\n\n这个练习已有 10 天没有学员活动。连续 14 天无活动时，机器人会关闭 PR 并删除临时训练分支。\n");
    }
  }
}

const LABEL_DEFINITIONS = {
  "exercise:1": ["1f883d", "练习 1：第一次 Pull Request"],
  "exercise:2": ["1f883d", "练习 2：暂存区与原子提交"],
  "exercise:3": ["1f883d", "练习 3：清晰地发起协作"],
  "exercise:4": ["1f883d", "练习 4：Draft Pull Request"],
  "exercise:5": ["1f883d", "练习 5：响应 Code Review"],
  "exercise:6": ["1f883d", "练习 6：同步上游更新"],
  "exercise:7": ["1f883d", "练习 7：解决合并冲突"],
  "exercise:8": ["1f883d", "练习 8：协作综合练习"],
  "exercise:9": ["1f883d", "练习 9：从 CI 失败中定位问题"],
  "session:active": ["0969da", "训练会话正在进行"],
  "session:blocked": ["d1242f", "训练会话被前置条件阻止"],
  "session:needs-fix": ["d1242f", "自动检查发现必须修复项"],
  "session:ready": ["1a7f37", "练习已通过，等待自动合并"],
  "session:completed": ["8250df", "练习已完成"],
  "session:expired": ["6e7781", "训练会话已过期"],
  "automerge:disabled": ["b60205", "维护者暂停此 PR 的自动合并"],
};

async function handleBootstrap() {
  const client = clientFromEnv();
  const existing = await client.paginate(client.repoPath("/labels"));
  const names = new Set(existing.map((label) => label.name));
  for (const [name, [color, description]] of Object.entries(LABEL_DEFINITIONS)) {
    if (names.has(name)) await client.patch(client.repoPath(`/labels/${encodeURIComponent(name)}`), { color, description });
    else await client.post(client.repoPath("/labels"), { name, color, description });
  }
}

async function handleMigrateLegacy() {
  if (process.env.CONFIRM !== "CLOSE_LEGACY") throw new Error("Set workflow input to CLOSE_LEGACY to perform migration");
  const client = clientFromEnv();
  const [issues, pulls] = await Promise.all([
    client.paginate(client.repoPath("/issues?state=open")),
    client.paginate(client.repoPath("/pulls?state=open")),
  ]);
  const legacy = issues
    .filter((issue) => !issue.pull_request && issue.labels.some((label) => ["exercise1", "exercise2"].includes(label.name)))
    .map((issue) => ({ issue, branch: null, kind: "pre-session" }));

  const activeSessions = issues.filter((issue) => (
    !issue.pull_request &&
    issue.labels.some((label) => label.name === "session:active") &&
    exerciseFromLabels(issue.labels)
  ));
  for (const issue of activeSessions) {
    const exercise = exerciseFromLabels(issue.labels);
    const branch = `practice/ex${exercise}/issue-${issue.number}-${issue.user.login}`;
    try {
      const manifest = JSON.parse(await client.getContent(SESSION_FILE, branch));
      if (manifest.schemaVersion < SCHEMA_VERSION) legacy.push({ issue, branch, kind: "schema-v1" });
    } catch (error) {
      if (!(error instanceof GitHubApiError) || error.status !== 404) throw error;
    }
  }

  for (const { issue, branch, kind } of legacy) {
    const relatedPulls = pulls.filter((pull) => branch
      ? pull.base.ref === branch
      : pull.base.ref === "main" && closingIssueNumbers(pull.body ?? "").includes(issue.number));
    for (const pr of relatedPulls) {
      await client.post(client.repoPath(`/issues/${pr.number}/comments`), { body: "课程已升级为九个递进关卡和 schema v2。此旧版 PR 无法安全沿用，请通过新的 Exercise Issue Form 重新开始；原有 commit 仍保留在你的 Fork 中。" });
      await client.patch(client.repoPath(`/pulls/${pr.number}`), { state: "closed" });
    }
    if (branch) await client.deleteRef(branch);
    if (kind === "schema-v1") await client.setStatusLabel(issue.number, "session:expired");
    await client.post(client.repoPath(`/issues/${issue.number}/comments`), { body: "课程已升级为准备篇和九个递进关卡。此旧会话现已结束，请从新的学习地图和 Exercise Issue Form 重新开始；原有内容仍保留在 GitHub 历史中。" });
    await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
  }
}

const handlers = {
  "issue-opened": handleIssueOpened,
  "grade-pr": handleGradePr,
  "ci-lab-pr": handleCiLabPr,
  "record-ci-lab-pass": handleRecordCiLabPass,
  "merge-pr": handleMergePr,
  cleanup: handleCleanup,
  bootstrap: handleBootstrap,
  "migrate-legacy": handleMigrateLegacy,
};

const command = process.argv[2];
if (!handlers[command]) {
  console.error(`Usage: node scripts/practice/workflow.mjs <${Object.keys(handlers).join("|")}>`);
  process.exitCode = 2;
} else {
  await handlers[command]();
}
