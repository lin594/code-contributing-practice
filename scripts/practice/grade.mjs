import {
  ADVISORY,
  CLOSING_REFERENCE,
  CONVENTIONAL_COMMIT,
  EXERCISE_LABELS,
  REQUIRED,
  WORKSPACE_FILE,
} from "./constants.mjs";
import { validateManifest } from "./session.mjs";

function rule(id, level, status, summary, remediation = "") {
  return { id, level, status, summary, remediation };
}

function pass(id, level, summary) {
  return rule(id, level, "pass", summary);
}

function fail(id, summary, remediation) {
  return rule(id, REQUIRED, "fail", summary, remediation);
}

function warn(id, summary, remediation) {
  return rule(id, ADVISORY, "warn", summary, remediation);
}

function pending(id, summary, remediation) {
  return rule(id, REQUIRED, "pending", summary, remediation);
}

export function closingIssueNumbers(body = "") {
  const numbers = new Set();
  for (const match of body.matchAll(CLOSING_REFERENCE)) numbers.add(Number(match[1]));
  return [...numbers];
}

function labelsOf(value = []) {
  return value.map((label) => (typeof label === "string" ? label : label.name));
}

function gradeCommon(input, results) {
  const { pr, session, issue, files = [], commits = [] } = input;

  if (!validateManifest(session)) {
    results.push(fail("session.valid", "训练会话清单无效或已损坏。", "请回到练习 Issue 重新创建会话，不要修改 session.json。"));
    return false;
  }
  results.push(pass("session.valid", REQUIRED, "训练会话有效。"));

  const references = closingIssueNumbers(pr.body);
  if (!references.includes(session.issueNumber)) {
    results.push(fail("pr.closing-reference", `PR 正文没有正确引用练习 Issue #${session.issueNumber}。`, `在 PR 正文加入 \`Closes #${session.issueNumber}\`。`));
  } else {
    results.push(pass("pr.closing-reference", REQUIRED, `PR 已引用 Issue #${session.issueNumber}。`));
  }

  const expectedLabel = EXERCISE_LABELS.get(session.exercise);
  const issueLabels = labelsOf(issue.labels);
  const sameOwner = pr.author.toLowerCase() === session.actor.toLowerCase() && issue.author.toLowerCase() === session.actor.toLowerCase();
  const assigned = issue.assignees.some((login) => login.toLowerCase() === session.actor.toLowerCase());
  if (issue.number !== session.issueNumber || issue.state !== "open" || !sameOwner || !assigned || !issueLabels.includes(expectedLabel)) {
    results.push(fail("issue.ownership", "PR 没有关联到本人已认领的正确练习 Issue。", "请使用机器人创建的专属分支，并确认 PR 作者、Issue 作者和 assignee 是同一账号。"));
  } else {
    results.push(pass("issue.ownership", REQUIRED, "Issue、PR 和练习账号一致。"));
  }

  if (pr.baseRef !== session.baseBranch) {
    results.push(fail("branch.base", `PR base 当前是 ${pr.baseRef}，不是专属训练分支。`, `在 PR 页面把 base 改为 \`${session.baseBranch}\`。`));
  } else {
    results.push(pass("branch.base", REQUIRED, "PR 指向正确的专属训练分支。"));
  }

  if (["main", "master"].includes(pr.headRef.toLowerCase())) {
    results.push(fail("branch.head", "不要直接使用 Fork 的 main/master 分支提交练习。", `创建 topic branch，例如 \`exercise/${session.exercise}-${session.issueNumber}\`，再更新 PR。`));
  } else {
    results.push(pass("branch.head", REQUIRED, "练习来自独立 topic branch。"));
  }

  const changedPaths = files.map((file) => file.filename);
  if (files.length !== 1 || changedPaths[0] !== WORKSPACE_FILE || files[0].status !== "modified") {
    results.push(fail("files.scope", `练习只能修改 ${WORKSPACE_FILE}，当前变更：${changedPaths.join(", ") || "无"}。`, `撤销其他文件的改动，并确保只修改 \`${WORKSPACE_FILE}\`。`));
  } else {
    results.push(pass("files.scope", REQUIRED, "改动范围正确，session.json 保持不变。"));
  }

  if (pr.draft) {
    results.push(fail("pr.ready", "Draft PR 不会自动完成练习。", "准备好后在 PR 页面点击 “Ready for review”。"));
  } else {
    results.push(pass("pr.ready", REQUIRED, "PR 已进入可评审状态。"));
  }

  const prLabels = labelsOf(pr.labels);
  if (prLabels.includes("automerge:disabled") || input.humanChangesRequested) {
    results.push(fail("merge.allowed", "维护者已暂停自动合并或提出必须处理的修改。", "先处理维护者反馈；确认无误后请维护者移除阻止状态。"));
  } else {
    results.push(pass("merge.allowed", REQUIRED, "没有人工阻止自动合并。"));
  }

  const nonConventional = commits.filter((commit) => !CONVENTIONAL_COMMIT.test(commit.message.split("\n", 1)[0]));
  if (nonConventional.length) {
    results.push(warn("commits.message", `有 ${nonConventional.length} 条 commit message 不符合推荐格式。`, `推荐使用 \`type: summary\`，例如 \`docs: add my practice notes\`；最近一次可用 \`git commit --amend\` 修改。`));
  } else {
    results.push(pass("commits.message", ADVISORY, "Commit message 符合推荐格式。"));
  }

  const noisy = commits.filter((commit) => /^(?:wip\b|fixup!|squash!)/i.test(commit.message));
  if (noisy.length) {
    results.push(warn("commits.polish", "提交历史中含 WIP、fixup! 或 squash! 标记。", "真实开源贡献前通常会整理这些临时提交；本练习不会因此失败。"));
  }

  const title = pr.title.trim();
  if (title.length < 10 || title.length > 72 || /^(update|test|pr|练习|修改|提交)$/i.test(title) || !CONVENTIONAL_COMMIT.test(title)) {
    results.push(warn("pr.title", `PR 标题“${title || "（空）"}”可以更清楚。`, `建议使用动作明确的标题，例如 \`docs: complete exercise ${session.exercise}\`；可直接在 GitHub PR 页面编辑。`));
  } else {
    results.push(pass("pr.title", ADVISORY, "PR 标题清楚且符合推荐格式。"));
  }

  if (!/^(?:exercise|docs|feat|fix)\//.test(pr.headRef)) {
    results.push(warn("branch.name", `分支名“${pr.headRef}”可以表达得更清楚。`, `建议使用 \`exercise/${session.exercise}-${session.issueNumber}\`。`));
  }

  return true;
}

function gradeExercise(input, results) {
  const { session, commits = [], workspace = "", feedbackState = {} } = input;
  const hasMergeCommit = commits.some((commit) => (commit.parents?.length ?? 1) > 1);

  if (session.exercise === 1) {
    if (commits.length !== 1) results.push(fail("exercise1.commit-count", `练习 1 需要 1 条提交，当前有 ${commits.length} 条。`, "请使用交互式 rebase 或重新建立练习分支，把本关整理为一条提交。"));
    else results.push(pass("exercise1.commit-count", REQUIRED, "练习 1 恰好包含一条提交。"));
    if (hasMergeCommit) results.push(fail("exercise1.no-merge", "第一次贡献不应包含 merge commit。", "从专属 base 重新建立 topic branch，并用一条普通提交完成练习。"));

    const complete = !workspace.includes("TODO") && workspace.toLowerCase().includes(session.actor.toLowerCase()) && workspace.length >= 60;
    if (!complete) results.push(fail("exercise1.workspace", "自我介绍仍有占位符，或没有填写当前 GitHub 用户名。", `把 TODO 替换为你的内容，并在“GitHub 用户名”中填写 ${session.actor}。`));
    else results.push(pass("exercise1.workspace", REQUIRED, "第一次贡献内容已填写完整。"));
  }

  if (session.exercise === 2) {
    if (commits.length !== 2) results.push(fail("exercise2.commit-count", `练习 2 需要 2 条提交，当前有 ${commits.length} 条。`, "请让第一个 commit 填写 Git 命令，第二个 commit 解释干净历史；多余提交可用 rebase 整理。"));
    else results.push(pass("exercise2.commit-count", REQUIRED, "练习 2 恰好包含两条提交。"));
    if (hasMergeCommit) results.push(fail("exercise2.no-merge", "练习 2 的历史中包含 merge commit。", "从专属 base 重新建立分支，或使用 rebase 整理为两条线性提交。"));
    else results.push(pass("exercise2.no-merge", REQUIRED, "提交历史保持线性，没有混入 merge commit。"));
    const complete = !workspace.includes("TODO") && workspace.includes("## 我学到的 Git 命令") && workspace.includes("## 为什么要保持提交历史干净");
    if (!complete) results.push(fail("exercise2.workspace", "两部分练习内容尚未填写完整。", "分别在第一、第二条提交中完成模板的两个 TODO。"));
    else results.push(pass("exercise2.workspace", REQUIRED, "两次提交对应的内容均已完成。"));
  }

  if (session.exercise === 3) {
    if (!feedbackState.revisionRequestedSha) {
      results.push(pending("exercise3.review", "机器人已完成第一次 Review，正在等待你修改。", "保留当前 PR，在同一分支继续修改、commit 和 push；不要新建 PR。"));
    } else if (feedbackState.revisionRequestedSha === input.pr.headSha) {
      results.push(pending("exercise3.review", "PR 还停留在机器人提出修改时的 commit。", "按照评论修改后，在当前分支 commit 并 push。"));
    } else {
      const complete = workspace.includes("状态：已根据反馈修改") && workspace.includes("## 修改说明") && !workspace.includes("TODO");
      if (!complete) results.push(fail("exercise3.review", "已经收到新提交，但指定的 Review 修改尚未完整落实。", "把状态改为“已根据反馈修改”，新增“## 修改说明”，并删除 TODO。"));
      else results.push(pass("exercise3.review", REQUIRED, "已在同一 PR 中完成 Review 修改。"));
      if (!input.authorResponded) results.push(warn("exercise3.response", "尚未看到你对机器人反馈的文字回应。", "建议在 PR 留言简要说明你修改了什么，这是良好的开源协作习惯。"));
    }
    if (hasMergeCommit) results.push(fail("exercise3.no-merge", "本关不需要 merge commit。", "继续在原 topic branch 上直接 commit/push，必要时用 rebase 整理历史。"));
  }

  if (session.exercise === 4) {
    if (!session.conflictBaseSha) {
      results.push(pending("exercise4.injected", "机器人正在准备上游冲突。", "稍后刷新 PR，按评论执行 fetch 并解决冲突。"));
    } else if (!input.conflictBaseIncluded) {
      results.push(fail("exercise4.ancestry", "你的分支尚未包含机器人注入的上游更新。", `执行 \`git fetch upstream ${session.baseBranch}\`，再 merge 或 rebase 该分支并解决冲突。`));
    } else {
      results.push(pass("exercise4.ancestry", REQUIRED, "分支已纳入最新上游提交。"));
    }
    if (!workspace.includes("上游更新") || !workspace.includes("我的修改")) {
      results.push(fail("exercise4.resolution", "冲突结果没有同时保留“上游更新”和“我的修改”。", "编辑冲突标记之间的内容，保留双方文字，再 git add、commit 并 push。"));
    } else {
      results.push(pass("exercise4.resolution", REQUIRED, "冲突解决结果保留了双方内容。"));
    }
  }
}

export function gradePractice(input) {
  const results = [];
  const validSession = gradeCommon(input, results);
  if (validSession) gradeExercise(input, results);
  const blocked = results.some((item) => item.level === REQUIRED && ["fail", "pending"].includes(item.status));
  const warnings = results.filter((item) => item.status === "warn").length;
  return {
    schemaVersion: 1,
    outcome: blocked ? "fail" : "pass",
    headSha: input.pr.headSha,
    session: input.session,
    results,
    warnings,
    nextActions: blocked
      ? ["按“必须修复”表格逐项修改。", "继续 push 当前 PR 的分支，机器人会自动复查。"]
      : ["练习已通过，机器人将自动 squash merge。", warnings ? "Warning 不阻止完成，但建议在真实开源贡献前采纳。" : "可以继续下一关。"],
  };
}

export function maintenanceReport(pr, commits = []) {
  const results = [];
  const invalid = commits.filter((commit) => !CONVENTIONAL_COMMIT.test(commit.message.split("\n", 1)[0]));
  if (invalid.length) results.push(warn("commits.message", "部分 commit message 不符合推荐格式。", "建议使用 type: summary，例如 docs: improve troubleshooting guide。"));
  else results.push(pass("commits.message", ADVISORY, "Commit message 符合推荐格式。"));
  if (!CONVENTIONAL_COMMIT.test(pr.title.trim())) results.push(warn("pr.title", "PR 标题可以更清楚。", "建议使用 type: summary；维护 PR 仍需人工 Review。"));
  else results.push(pass("pr.title", ADVISORY, "PR 标题符合推荐格式。"));
  return { schemaVersion: 1, outcome: "maintenance", headSha: pr.headSha, session: null, results, warnings: results.filter((r) => r.status === "warn").length, nextActions: ["这是维护 PR，不会自动合并。", "等待 CI 和维护者 Review。"] };
}
