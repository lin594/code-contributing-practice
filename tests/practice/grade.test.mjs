import assert from "node:assert/strict";
import test from "node:test";
import { gradePractice, closingIssueNumbers, maintenanceReport } from "../../scripts/practice/grade.mjs";
import { createManifest } from "../../scripts/practice/session.mjs";

function inputFor(exercise, overrides = {}) {
  const session = createManifest({ exercise, issueNumber: 42, actor: "octocat", createdAt: "2026-08-20T00:00:00.000Z" });
  const workspaces = {
    1: "# 我的第一次开源贡献\n\n- GitHub 用户名：octocat\n- 我希望参与的开源方向：改进开源项目文档并帮助其他初学者。\n",
    2: "# 干净的提交历史\n\n## 我学到的 Git 命令\n\ngit rebase -i\n\n## 为什么要保持提交历史干净\n\n让评审者容易理解每一步。\n",
    3: "# 响应 Code Review\n\n状态：已根据反馈修改\n\n## 本次修改\n\n补充说明。\n\n## 修改说明\n\n删除占位内容。\n",
    4: "# 解决上游冲突\n\n## 最终决定\n\n最终内容：上游更新 + 我的修改\n",
  };
  const counts = { 1: 1, 2: 2, 3: 2, 4: 2 };
  const commits = Array.from({ length: counts[exercise] }, (_, index) => ({ sha: `sha${index}`, message: `docs: complete part ${index + 1}`, parents: ["parent"] }));
  return {
    pr: { number: 99, title: `docs: complete exercise ${exercise}`, body: "Closes #42", author: "octocat", baseRef: session.baseBranch, headRef: `exercise/${exercise}-42`, headSha: "headsha", draft: false, labels: [] },
    session: exercise === 4 ? { ...session, state: "conflict-injected", conflictBaseSha: "base-sha" } : session,
    issue: { number: 42, author: "octocat", assignees: ["octocat"], labels: [`exercise:${exercise}`], state: "open" },
    files: [{ filename: ".practice/workspace.md", status: "modified" }],
    commits,
    workspace: workspaces[exercise],
    feedbackState: exercise === 3 ? { revisionRequestedSha: "old-head" } : {},
    conflictBaseIncluded: exercise === 4,
    authorResponded: true,
    humanChangesRequested: false,
    ...overrides,
  };
}

test("extracts supported closing keywords", () => {
  assert.deepEqual(closingIssueNumbers("Fixes: #12, resolves #14 and CLOSED #12"), [12, 14]);
  assert.deepEqual(closingIssueNumbers("disclose #12"), []);
});

for (const exercise of [1, 2, 3, 4]) {
  test(`exercise ${exercise} passes its complete fixture`, () => {
    const report = gradePractice(inputFor(exercise));
    assert.equal(report.outcome, "pass", JSON.stringify(report.results, null, 2));
  });
}

test("commit and PR title style only produce warnings", () => {
  const input = inputFor(1);
  input.pr.title = "修改";
  input.commits[0].message = "WIP add notes";
  const report = gradePractice(input);
  assert.equal(report.outcome, "pass");
  assert.ok(report.results.some((item) => item.id === "commits.message" && item.status === "warn"));
  assert.ok(report.results.some((item) => item.id === "pr.title" && item.status === "warn"));
});

test("wrong commit count, merge history and extra files block", () => {
  const input = inputFor(2);
  input.commits.push({ sha: "merge", message: "merge branch", parents: ["a", "b"] });
  input.files.push({ filename: "README.md", status: "modified" });
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  for (const id of ["exercise2.commit-count", "exercise2.no-merge", "files.scope"]) {
    assert.ok(report.results.some((item) => item.id === id && item.status === "fail"));
  }
});

test("exercise 3 requires a new head in the same PR", () => {
  const first = inputFor(3, { feedbackState: {} });
  const firstReport = gradePractice(first);
  assert.equal(firstReport.outcome, "fail");
  assert.equal(firstReport.results.find((item) => item.id === "exercise3.review").status, "pending");

  const unchanged = inputFor(3, { feedbackState: { revisionRequestedSha: "headsha" } });
  assert.equal(gradePractice(unchanged).outcome, "fail");
});

test("exercise 4 requires injected ancestry and both conflict sides", () => {
  const missingBase = inputFor(4, { conflictBaseIncluded: false });
  assert.equal(gradePractice(missingBase).outcome, "fail");
  const lostSide = inputFor(4, { workspace: "最终内容：我的修改" });
  assert.equal(gradePractice(lostSide).outcome, "fail");
});

test("ownership, base, issue reference and kill switch are hard gates", () => {
  const input = inputFor(1);
  input.pr.body = "See #41";
  input.pr.baseRef = "main";
  input.pr.labels = ["automerge:disabled"];
  input.issue.author = "someone-else";
  input.issue.state = "closed";
  const report = gradePractice(input);
  assert.equal(report.outcome, "fail");
  for (const id of ["pr.closing-reference", "issue.ownership", "branch.base", "merge.allowed"]) {
    assert.ok(report.results.some((item) => item.id === id && item.status === "fail"));
  }
});

test("maintenance PRs never become practice passes", () => {
  const report = maintenanceReport({ title: "update", headSha: "abc" }, [{ message: "anything" }]);
  assert.equal(report.outcome, "maintenance");
  assert.equal(report.warnings, 2);
});
