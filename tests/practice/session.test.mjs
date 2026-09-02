import assert from "node:assert/strict";
import test from "node:test";
import { EXERCISE_COUNT, SCHEMA_VERSION } from "../../scripts/practice/constants.mjs";
import {
  branchNameFor,
  createManifest,
  exerciseFromLabels,
  issueInstructions,
  parseSessionBranch,
  sessionFiles,
  shouldHandleIssueEvent,
  shouldSkipGradeEvent,
  validateManifest,
  workspaceTemplate,
} from "../../scripts/practice/session.mjs";

test("session branch and manifest are deterministic", () => {
  const manifest = createManifest({ exercise: 8, issueNumber: 123, actor: "octo-cat", createdAt: "2026-08-20T00:00:00Z" });
  assert.equal(SCHEMA_VERSION, 2);
  assert.equal(EXERCISE_COUNT, 8);
  assert.equal(manifest.baseBranch, "practice/ex8/issue-123-octo-cat");
  assert.deepEqual(parseSessionBranch(manifest.baseBranch), { exercise: 8, issueNumber: 123, actor: "octo-cat" });
  assert.equal(validateManifest(manifest), true);
  assert.deepEqual(Object.keys(sessionFiles(manifest)).sort(), [".practice/session.json", ".practice/workspace.md"]);
});

test("invalid actors and tampered manifests are rejected", () => {
  assert.throws(() => branchNameFor({ exercise: 1, issueNumber: 1, actor: "bad/name" }));
  assert.throws(() => branchNameFor({ exercise: 0, issueNumber: 1, actor: "octocat" }), /from 1 to 8/);
  assert.throws(() => branchNameFor({ exercise: 9, issueNumber: 1, actor: "octocat" }), /from 1 to 8/);
  const manifest = createManifest({ exercise: 1, issueNumber: 1, actor: "octocat" });
  assert.equal(validateManifest({ ...manifest, baseBranch: "main" }), false);
  assert.equal(validateManifest({ ...manifest, schemaVersion: 1 }), false);
  assert.equal(parseSessionBranch("practice/ex9/issue-1-octocat"), null);
});

test("all eight exercises have a workspace and label", () => {
  for (let exercise = 1; exercise <= EXERCISE_COUNT; exercise += 1) {
    assert.match(workspaceTemplate(exercise), /^# /);
    assert.equal(exerciseFromLabels([{ name: `exercise:${exercise}` }]), exercise);
  }
  assert.throws(() => workspaceTemplate(9), /unknown exercise/);
});

test("exercise 1 can be completed by replacing only its two visible placeholders", () => {
  const completed = workspaceTemplate(1)
    .replace("GitHub 用户名：TODO", "GitHub 用户名：octocat")
    .replace("我希望参与的开源方向：TODO", "我希望参与的开源方向：改进文档");
  assert.doesNotMatch(completed, /TODO/);
});

test("issue instructions route learners to the matching lesson and safe branch", () => {
  const manifest = createManifest({ exercise: 6, issueNumber: 42, actor: "octocat" });
  const body = issueInstructions({ manifest, repositoryUrl: "https://github.com/owner/repo" });
  assert.match(body, /docs\/lessons\/06-sync-upstream\.md/);
  assert.match(body, /git fetch upstream practice\/ex6\/issue-42-octocat/);
  assert.match(body, /git switch -c exercise\/6-42/);
});

test("session automation ignores its own status labels and closed issues", () => {
  const issue = { state: "open" };
  assert.equal(shouldHandleIssueEvent({ action: "opened", issue }), true);
  assert.equal(shouldHandleIssueEvent({ action: "labeled", label: { name: "exercise:1" }, issue }), true);
  assert.equal(shouldHandleIssueEvent({ action: "labeled", label: { name: "exercise:8" }, issue }), true);
  assert.equal(shouldHandleIssueEvent({ action: "labeled", label: { name: "session:active" }, issue }), false);
  assert.equal(shouldHandleIssueEvent({ action: "reopened", issue: { state: "closed" } }), false);
  assert.equal(shouldSkipGradeEvent({ action: "labeled", label: { name: "session:ready" } }), true);
  assert.equal(shouldSkipGradeEvent({ action: "labeled", label: { name: "automerge:disabled" } }), false);
  assert.equal(shouldSkipGradeEvent({ action: "created", issue: { number: 1, state: "open" } }), true);
  assert.equal(shouldSkipGradeEvent({ action: "created", issue: { number: 2, state: "open", pull_request: { url: "https://api.github.test/pulls/2" } } }), false);
  assert.equal(shouldSkipGradeEvent({ action: "created", issue: { number: 3, state: "closed", pull_request: { url: "https://api.github.test/pulls/3" } } }), true);
});
