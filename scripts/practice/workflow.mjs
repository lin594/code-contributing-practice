#!/usr/bin/env node
import fs from "node:fs";
import {
  EXERCISE_LABELS,
  FEEDBACK_MARKER,
  SESSION_FILE,
  SESSION_MARKER,
  WORKSPACE_FILE,
} from "./constants.mjs";
import { parseFeedbackState, renderFeedback } from "./feedback.mjs";
import { closingIssueNumbers, gradePractice, maintenanceReport } from "./grade.mjs";
import { GitHubApiError, GitHubClient } from "./github.mjs";
import { assertMergeEligible, canInjectConflict, expiryDecision, hasBlockingReview } from "./lifecycle.mjs";
import {
  createManifest,
  exerciseFromLabels,
  issueInstructions,
  parseSessionBranch,
  sessionFiles,
  shouldHandleIssueEvent,
  shouldSkipGradeEvent,
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

async function injectConflict(client, manifest) {
  if (manifest.exercise !== 4 || manifest.conflictBaseSha) return manifest;
  const current = await client.getContent(WORKSPACE_FILE, manifest.baseBranch);
  if (!current.includes("最终内容：待填写")) throw new Error("Exercise 4 base workspace is not in the expected initial state");
  const changed = current.replace("最终内容：待填写", "最终内容：上游更新");
  const conflictCommit = await client.commitFiles(manifest.baseBranch, { [WORKSPACE_FILE]: changed }, "chore(practice): inject upstream conflict");
  return replaceSessionState(client, manifest, { state: "conflict-injected", conflictBaseSha: conflictCommit.sha });
}

async function prerequisiteComplete(client, actor, exercise) {
  if (exercise === 1) return true;
  const labelQuery = encodeURIComponent(`${EXERCISE_LABELS.get(exercise - 1)},session:completed`);
  const issues = await client.paginate(client.repoPath(`/issues?state=closed&creator=${encodeURIComponent(actor)}&labels=${labelQuery}`));
  return issues.some((issue) => !issue.pull_request);
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
    await client.upsertComment(issue.number, SESSION_MARKER, `<!-- ${SESSION_MARKER} -->\n## 前置练习尚未完成\n\n请先完成练习 ${exercise - 1}。完成后重新打开本 Issue，机器人会再次检查。\n`);
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

async function conflictBaseIncluded(client, manifest, pr) {
  if (!manifest.conflictBaseSha) return false;
  const head = `${pr.head.repo.owner.login}:${pr.head.ref}`;
  try {
    const compare = await client.get(client.repoPath(`/compare/${encodeURIComponent(manifest.conflictBaseSha)}...${encodeURIComponent(head)}`));
    return compare.status === "ahead" || compare.status === "identical";
  } catch (error) {
    if (error instanceof GitHubApiError && [404, 422].includes(error.status)) return false;
    throw error;
  }
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
  return {
    pr: normalizePr(rawPr),
    session: manifest,
    issue: normalizeIssue(rawIssue),
    files: files.map((file) => ({ filename: file.filename, status: file.status, changes: file.changes })),
    commits: rawCommits.map((commit) => ({ sha: commit.sha, message: commit.commit.message, parents: commit.parents })),
    workspace,
    feedbackState,
    authorResponded,
    humanChangesRequested,
    conflictBaseIncluded: manifest.exercise === 4 ? await conflictBaseIncluded(client, manifest, rawPr) : false,
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

  if (canInjectConflict({ pr: rawPr, manifest, referencedIssues: closingIssueNumbers(rawPr.body ?? "") })) {
    manifest = await injectConflict(client, manifest);
    rawPr = await client.get(client.repoPath(`/pulls/${prNumber}`));
  }

  const input = await collectPracticeInput(client, rawPr, manifest, feedbackComment);
  const report = gradePractice(input);
  const state = { ...input.feedbackState };
  if (manifest.exercise === 3 && !state.revisionRequestedSha) {
    state.revisionRequestedSha = rawPr.head.sha;
    state.revisionRequestedAt = new Date().toISOString();
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
  await client.upsertComment(manifest.issueNumber, "practice-completion:v1", `<!-- practice-completion:v1 -->\n## 🎉 练习 ${manifest.exercise} 完成\n\nPR #${prNumber} 已合并，专属训练分支已清理。${manifest.exercise < 4 ? ` 现在可以开始练习 ${manifest.exercise + 1}。` : " 你已经完成核心训练，可以前往真实开源仓库寻找适合的问题参与。"}\n`);
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
  "exercise:1": ["1f883d", "练习 1：第一次贡献"],
  "exercise:2": ["1f883d", "练习 2：干净的提交历史"],
  "exercise:3": ["1f883d", "练习 3：响应 Code Review"],
  "exercise:4": ["1f883d", "练习 4：解决上游冲突"],
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
    client.paginate(client.repoPath("/pulls?state=open&base=main")),
  ]);
  const legacy = issues.filter((issue) => !issue.pull_request && issue.labels.some((label) => ["exercise1", "exercise2"].includes(label.name)));
  for (const issue of legacy) {
    for (const pr of pulls.filter((pull) => closingIssueNumbers(pull.body ?? "").includes(issue.number))) {
      await client.post(client.repoPath(`/issues/${pr.number}/comments`), { body: "仓库练习系统已升级为临时会话分支。此旧版 PR 不再合入 main，请通过新的 Exercise Issue Form 重新开始。" });
      await client.patch(client.repoPath(`/pulls/${pr.number}`), { state: "closed" });
    }
    await client.post(client.repoPath(`/issues/${issue.number}/comments`), { body: "仓库练习系统已升级。此旧会话现已结束，请通过新的 Exercise Issue Form 重新开始；原有内容仍保留在 GitHub 历史中。" });
    await client.patch(client.repoPath(`/issues/${issue.number}`), { state: "closed", state_reason: "not_planned" });
  }
}

const handlers = {
  "issue-opened": handleIssueOpened,
  "grade-pr": handleGradePr,
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
