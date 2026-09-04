import assert from "node:assert/strict";
import test from "node:test";
import { closingIssueNumbers, gradePractice, hasCurrentCiVerification, maintenanceReport } from "../../scripts/practice/grade.mjs";
import { createManifest } from "../../scripts/practice/session.mjs";

const COMPLETE_WORKSPACES = {
  1: "# 我的第一次开源贡献\n\n- GitHub 用户名：octocat\n- 我希望参与的开源方向：改进开源项目文档并帮助其他初学者。\n",
  2: "# 干净的提交历史\n\n## 我学到的 Git 命令\n\ngit diff --staged\n\n## 为什么要保持提交历史干净\n\n让评审者容易理解每一步。\n",
  3: "# 清晰地发起协作\n\n## 变更目的\n\n帮助新生理解分支。\n\n## 验证方式\n\n检查说明和示例是否一致。\n",
  4: "# Draft Pull Request\n\n状态：可以评审\n\n## 完成标准\n\n说明包含目标和验证方法。\n",
  5: "# 响应 Code Review\n\n状态：已根据反馈修改\n\n## 本次修改\n\n补充说明。\n\n## 修改说明\n\n删除占位内容并澄清目标。\n",
  6: "# 同步上游更新\n\n## 课程公告\n\n课程公告：上游已更新\n\n## 我的同步笔记\n\n个人笔记：fetch 只获取远端数据，merge 或 rebase 才会整合。\n",
  7: "# 解决上游冲突\n\n## 最终决定\n\n最终内容：上游更新 + 我的修改\n",
  8: "# 协作综合练习\n\n状态：已完成协作修订\n\n## 变更目的\n\n帮助同学检查贡献流程。\n\n## 协作约定\n\n协作约定：提交前先同步上游并回应 Review\n\n## 自测结果\n\n已检查 diff、提交历史和 PR 说明。\n\n## Review 回复\n\n已根据意见补充验证方法。\n",
  9: "# 从 CI 失败中定位问题\n\n- 学习者：octocat\n- 项目协作规则：[贡献指南](../CONTRIBUTING.md)\n\n## 失败的 check\n\nPractice / Grade\n\n## 失败的 step\n\nCheck local Markdown links\n\n## 第一条可行动错误\n\nworkspace 第 4 行链接目标不存在。\n\n## 本地复现\n\nnpm run check:ci-lab 得到相同失败。\n\n## 修复内容\n\n把链接改为仓库根目录中的贡献指南。\n",
};

function inputFor(exercise, overrides = {}) {
  const baseSession = createManifest({ exercise, issueNumber: 42, actor: "octocat", createdAt: "2026-08-20T00:00:00.000Z" });
  const session = [6, 7, 8].includes(exercise)
    ? { ...baseSession, state: "upstream-injected", upstreamBaseSha: "base-sha" }
    : baseSession;
  const counts = { 1: 1, 2: 2, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 3, 9: 2 };
  const commits = Array.from({ length: counts[exercise] }, (_, index) => ({
    sha: `sha${index}`,
    message: `docs: complete part ${index + 1}`,
    parents: ["parent"],
  }));
  const feedbackState = exercise === 4
    ? { draftObservedAt: "2026-08-20T00:01:00.000Z" }
    : [5, 8].includes(exercise)
      ? { revisionRequestedSha: "old-head", revisionRequestedAt: "2026-08-20T00:01:00.000Z" }
      : exercise === 9
        ? { ciFailureObservedSha: "1111111111111111111111111111111111111111", ciFailureObservedAt: "2026-08-20T00:01:00.000Z" }
        : {};
  return {
    pr: {
      number: 99,
      title: `docs: complete exercise ${exercise}`,
      body: "## 练习说明\n\n- 我完成了：本关要求\n\nCloses #42",
      author: "octocat",
      baseRef: session.baseBranch,
      headRef: `exercise/${exercise}-42`,
      headSha: "abcdef1234567890abcdef1234567890abcdef12",
      draft: false,
      labels: [],
    },
    session,
    issue: { number: 42, author: "octocat", assignees: ["octocat"], labels: [`exercise:${exercise}`], state: "open" },
    files: [{ filename: ".practice/workspace.md", status: "modified" }],
    commits,
    commitWorkspaces: exercise === 2
      ? [
          "# 干净的提交历史\n\n## 我学到的 Git 命令\n\ngit diff --staged\n\n## 为什么要保持提交历史干净\n\nTODO：请在第二个 commit 中填写。\n",
          COMPLETE_WORKSPACES[2],
        ]
      : [],
    workspace: COMPLETE_WORKSPACES[exercise],
    feedbackState,
    upstreamBaseIncluded: [6, 7, 8].includes(exercise),
    authorResponded: true,
    authorCiVerified: exercise === 9,
    ciLab: exercise === 9 ? { ok: true, problems: [] } : null,
    ciCheckPassed: exercise === 9,
    humanChangesRequested: false,
    ...overrides,
  };
}

test("extracts supported closing keywords", () => {
  assert.deepEqual(closingIssueNumbers("Fixes: #12, resolves #14 and CLOSED #12"), [12, 14]);
  assert.deepEqual(closingIssueNumbers("disclose #12"), []);
});

for (let exercise = 1; exercise <= 9; exercise += 1) {
  test(`exercise ${exercise} passes its complete fixture`, () => {
    const report = gradePractice(inputFor(exercise));
    assert.equal(report.outcome, "pass", JSON.stringify(report.results, null, 2));
  });
}

test("early exercises teach PR metadata as advice instead of a hard gate", () => {
  const input = inputFor(1);
  input.pr.body = "这是我的第一次 PR";
  input.pr.title = "修改";
  input.pr.headRef = "try-it";
  input.commits[0].message = "WIP add notes";
  const report = gradePractice(input);
  assert.equal(report.outcome, "pass");
  for (const id of ["pr.closing-reference", "commits.message", "pr.title", "branch.name"]) {
    assert.equal(report.results.find((item) => item.id === id)?.status, "warn");
  }
});

test("exercise 1 requires the signed-in username and a non-empty direction", () => {
  const wrongUser = inputFor(1, { workspace: COMPLETE_WORKSPACES[1].replace("octocat", "someone-else") });
  const emptyDirection = inputFor(1, { workspace: "# 我的第一次开源贡献\n\n- GitHub 用户名：octocat\n- 我希望参与的开源方向：\n\n请填写上面的用户名和开源方向。\n" });
  assert.equal(gradePractice(wrongUser).outcome, "fail");
  assert.equal(gradePractice(emptyDirection).outcome, "fail");
});

test("exercise 2 requires two linear atomic commits", () => {
  const input = inputFor(2);
  input.commits.push({ sha: "merge", message: "merge branch", parents: ["a", "b"] });
  input.files.push({ filename: "README.md", status: "modified" });
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  for (const id of ["exercise2.commit-count", "exercise2.no-merge", "files.scope"]) {
    assert.equal(report.results.find((item) => item.id === id)?.status, "fail");
  }
});

test("exercise 2 rejects both sections being completed in the first commit", () => {
  const input = inputFor(2);
  input.commitWorkspaces = [COMPLETE_WORKSPACES[2], COMPLETE_WORKSPACES[2]];
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  assert.equal(report.results.find((item) => item.id === "exercise2.atomicity")?.status, "fail");
});

test("exercise 3 makes clear branch, title, Issue link and PR explanation required", () => {
  const input = inputFor(3);
  input.pr.body = "See #42";
  input.pr.title = "修改";
  input.pr.headRef = "random";
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  for (const id of ["pr.closing-reference", "pr.title", "branch.name", "exercise3.description"]) {
    assert.equal(report.results.find((item) => item.id === id)?.status, "fail");
  }
});

test("exercise 3 does not count the untouched PR template comment as an explanation", () => {
  const input = inputFor(3);
  input.pr.body = "## 练习说明\n\n- 我完成了：<!-- 简短说明 -->\n\nCloses #42";
  const report = gradePractice(input);
  assert.equal(report.results.find((item) => item.id === "exercise3.description")?.status, "fail");
});

test("required reflection sections need learner-written content", () => {
  const emptySections = [
    inputFor(3, { workspace: "# 清晰地发起协作\n\n## 变更目的\n\n## 验证方式\n" }),
    inputFor(4, { workspace: "# Draft Pull Request\n\n状态：可以评审\n\n## 完成标准\n" }),
    inputFor(5, { workspace: "# 响应 Code Review\n\n状态：已根据反馈修改\n\n## 修改说明\n\n已修改。\n" }),
    inputFor(6, { workspace: "# 同步上游更新\n\n课程公告：上游已更新\n\n## 我的同步笔记\n" }),
    inputFor(8, { workspace: "# 协作综合练习\n\n状态：已完成协作修订\n\n## 变更目的\n\n## 协作约定\n\n协作约定：提交前先同步上游并回应 Review\n\n## 自测结果\n\n## Review 回复\n" }),
  ];
  for (const input of emptySections) assert.equal(gradePractice(input).outcome, "fail");
});

test("exercise 4 requires the PR to have been observed as a draft", () => {
  const report = gradePractice(inputFor(4, { feedbackState: {} }));
  assert.equal(report.outcome, "fail");
  assert.equal(report.results.find((item) => item.id === "exercise4.draft")?.status, "pending");
});

test("exercise 5 requires a new head in the same PR", () => {
  const first = inputFor(5, { feedbackState: {} });
  assert.equal(gradePractice(first).results.find((item) => item.id === "exercise5.review")?.status, "pending");

  const unchanged = inputFor(5, { feedbackState: { revisionRequestedSha: "abcdef1234567890abcdef1234567890abcdef12" } });
  assert.equal(gradePractice(unchanged).outcome, "fail");

  const noResponse = inputFor(5, { authorResponded: false });
  assert.equal(gradePractice(noResponse).results.find((item) => item.id === "exercise5.response")?.status, "fail");
});

test("exercise 6 requires the injected upstream commit and updated announcement", () => {
  const missingBase = inputFor(6, { upstreamBaseIncluded: false });
  assert.equal(gradePractice(missingBase).results.find((item) => item.id === "exercise6.ancestry")?.status, "fail");
  const staleContent = inputFor(6, { workspace: COMPLETE_WORKSPACES[6].replace("上游已更新", "等待同步") });
  assert.equal(gradePractice(staleContent).outcome, "fail");
});

test("exercise 7 requires injected ancestry and both conflict sides", () => {
  const missingBase = inputFor(7, { upstreamBaseIncluded: false });
  assert.equal(gradePractice(missingBase).outcome, "fail");
  const lostSide = inputFor(7, { workspace: "# 解决上游冲突\n\n## 最终决定\n\n最终内容：上游更新\n\n创建 PR 前，请把“待填写”改成“我的修改”。\n" });
  assert.equal(gradePractice(lostSide).outcome, "fail");
});

test("exercise 8 combines upstream sync, review revision, response and complete content", () => {
  for (const broken of [
    inputFor(8, { upstreamBaseIncluded: false }),
    inputFor(8, { feedbackState: { revisionRequestedSha: "abcdef1234567890abcdef1234567890abcdef12" } }),
    inputFor(8, { authorResponded: false }),
    inputFor(8, { workspace: COMPLETE_WORKSPACES[8].replace("已完成协作修订", "初稿") }),
  ]) {
    assert.equal(gradePractice(broken).outcome, "fail");
  }
});

test("CI verification requires the author, current SHA, evidence fields and a comment after failure", () => {
  const valid = {
    actor: "octocat",
    headSha: "abcdef1234567890abcdef1234567890abcdef12",
    verifiedAfter: "2026-08-20T00:01:00.000Z",
    comments: [{
      author: "octocat",
      createdAt: "2026-08-20T00:02:00.000Z",
      body: "CI 已通过：abcdef1；失败 check：Practice / Grade；失败 step：Check local Markdown links；本地复现：npm run check:ci-lab",
    }],
  };
  assert.equal(hasCurrentCiVerification(valid), true);
  assert.equal(hasCurrentCiVerification({ ...valid, actor: "someone-else" }), false);
  assert.equal(hasCurrentCiVerification({ ...valid, headSha: "9999999234567890abcdef1234567890abcdef12" }), false);
  assert.equal(hasCurrentCiVerification({ ...valid, verifiedAfter: "2026-08-20T00:03:00.000Z" }), false);
  assert.equal(hasCurrentCiVerification({ ...valid, comments: [{ ...valid.comments[0], createdAt: "not-a-date" }] }), false);
  assert.equal(hasCurrentCiVerification({ ...valid, comments: [{ ...valid.comments[0], body: "CI 已通过：abcdef1" }] }), false);
});

test("exercise 9 requires an observed failure and a new head before grading the repair", () => {
  const unobserved = inputFor(9, { feedbackState: {}, ciLab: { ok: false, problems: [{}] }, authorCiVerified: false });
  assert.equal(gradePractice(unobserved).results.find((item) => item.id === "exercise9.failure-observed")?.status, "pending");

  const unchanged = inputFor(9, {
    feedbackState: { ciFailureObservedSha: "abcdef1234567890abcdef1234567890abcdef12", ciFailureObservedAt: "2026-08-20T00:01:00.000Z" },
  });
  assert.equal(gradePractice(unchanged).results.find((item) => item.id === "exercise9.revision")?.status, "pending");
});

test("exercise 9 blocks a failing check, incomplete diagnosis and stale verification", () => {
  const failing = inputFor(9, { ciLab: { ok: false, problems: [{}] } });
  assert.equal(gradePractice(failing).results.find((item) => item.id === "exercise9.ci")?.status, "fail");

  const checkPending = inputFor(9, { ciCheckPassed: false });
  assert.equal(gradePractice(checkPending).results.find((item) => item.id === "exercise9.ci")?.status, "pending");

  const incomplete = inputFor(9, { workspace: COMPLETE_WORKSPACES[9].replace("npm run check:ci-lab 得到相同失败。", "TODO") });
  assert.equal(gradePractice(incomplete).results.find((item) => item.id === "exercise9.diagnosis")?.status, "fail");

  const staleComment = inputFor(9, { authorCiVerified: false });
  assert.equal(gradePractice(staleComment).results.find((item) => item.id === "exercise9.verification")?.status, "fail");
});

test("ownership, base, Issue state and kill switch remain hard gates", () => {
  const input = inputFor(1);
  input.pr.baseRef = "main";
  input.pr.labels = ["automerge:disabled"];
  input.issue.author = "someone-else";
  input.issue.state = "closed";
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  for (const id of ["issue.ownership", "branch.base", "merge.allowed"]) {
    assert.equal(report.results.find((item) => item.id === id)?.status, "fail");
  }
});

test("maintenance PRs never become practice passes", () => {
  const report = maintenanceReport({ title: "update", headSha: "abc" }, [{ message: "anything" }]);
  assert.equal(report.outcome, "maintenance");
  assert.equal(report.warnings, 2);
});
