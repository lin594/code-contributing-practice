import assert from "node:assert/strict";
import test from "node:test";
import { branchNameFor, createManifest, parseSessionBranch, sessionFiles, shouldHandleIssueEvent, shouldSkipGradeEvent, validateManifest } from "../../scripts/practice/session.mjs";

test("session branch and manifest are deterministic", () => {
  const manifest = createManifest({ exercise: 4, issueNumber: 123, actor: "octo-cat", createdAt: "2026-08-20T00:00:00Z" });
  assert.equal(manifest.baseBranch, "practice/ex4/issue-123-octo-cat");
  assert.deepEqual(parseSessionBranch(manifest.baseBranch), { exercise: 4, issueNumber: 123, actor: "octo-cat" });
  assert.equal(validateManifest(manifest), true);
  assert.deepEqual(Object.keys(sessionFiles(manifest)).sort(), [".practice/session.json", ".practice/workspace.md"]);
});

test("invalid actors and tampered manifests are rejected", () => {
  assert.throws(() => branchNameFor({ exercise: 1, issueNumber: 1, actor: "bad/name" }));
  const manifest = createManifest({ exercise: 1, issueNumber: 1, actor: "octocat" });
  assert.equal(validateManifest({ ...manifest, baseBranch: "main" }), false);
});

test("session automation ignores its own status labels and closed issues", () => {
  const issue = { state: "open" };
  assert.equal(shouldHandleIssueEvent({ action: "opened", issue }), true);
  assert.equal(shouldHandleIssueEvent({ action: "labeled", label: { name: "exercise:1" }, issue }), true);
  assert.equal(shouldHandleIssueEvent({ action: "labeled", label: { name: "session:active" }, issue }), false);
  assert.equal(shouldHandleIssueEvent({ action: "reopened", issue: { state: "closed" } }), false);
  assert.equal(shouldSkipGradeEvent({ action: "labeled", label: { name: "session:ready" } }), true);
  assert.equal(shouldSkipGradeEvent({ action: "labeled", label: { name: "automerge:disabled" } }), false);
});
