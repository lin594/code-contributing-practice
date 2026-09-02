import assert from "node:assert/strict";
import test from "node:test";
import { assertMergeEligible, canInjectUpstream, expiryDecision, hasBlockingReview } from "../../scripts/practice/lifecycle.mjs";

test("merge eligibility rejects stale heads and non-practice reports", () => {
  const valid = { report: { outcome: "pass", headSha: "abc" }, input: { session: { exercise: 1 } }, expectedHead: "abc" };
  assert.equal(assertMergeEligible(valid), true);
  assert.throws(() => assertMergeEligible({ ...valid, expectedHead: "new-head" }), /head changed/);
  assert.throws(() => assertMergeEligible({ ...valid, report: { outcome: "maintenance", headSha: "abc" } }), /no longer passes/);
});

test("session expiry has stable reminder and expiration boundaries", () => {
  const now = Date.parse("2026-08-20T00:00:00Z");
  assert.equal(expiryDecision("2026-08-11T00:00:01Z", { now }).action, "none");
  assert.equal(expiryDecision("2026-08-10T00:00:00Z", { now }).action, "remind");
  assert.equal(expiryDecision("2026-08-06T00:00:00Z", { now }).action, "expire");
  assert.throws(() => expiryDecision("not-a-date", { now }), /ISO date/);
});

test("only the session owner can trigger supported one-time upstream mutations", () => {
  const manifest = { exercise: 7, issueNumber: 42, actor: "octocat", baseBranch: "practice/ex7/issue-42-octocat" };
  const pr = { user: { login: "octocat" }, base: { ref: manifest.baseBranch } };
  for (const exercise of [6, 7, 8]) {
    const candidate = { ...manifest, exercise, baseBranch: `practice/ex${exercise}/issue-42-octocat` };
    assert.equal(canInjectUpstream({ pr: { ...pr, base: { ref: candidate.baseBranch } }, manifest: candidate, referencedIssues: [42] }), true);
  }
  assert.equal(canInjectUpstream({ pr, manifest, referencedIssues: [42] }), true);
  assert.equal(canInjectUpstream({ pr: { ...pr, user: { login: "attacker" } }, manifest, referencedIssues: [42] }), false);
  assert.equal(canInjectUpstream({ pr, manifest, referencedIssues: [41] }), false);
  assert.equal(canInjectUpstream({ pr, manifest: { ...manifest, upstreamBaseSha: "done" }, referencedIssues: [42] }), false);
  assert.equal(canInjectUpstream({ pr, manifest: { ...manifest, exercise: 5 }, referencedIssues: [42] }), false);
});

test("a comment review does not clear an outstanding change request", () => {
  const user = { login: "maintainer", type: "User" };
  assert.equal(hasBlockingReview([{ user, state: "CHANGES_REQUESTED" }, { user, state: "COMMENTED" }]), true);
  assert.equal(hasBlockingReview([{ user, state: "CHANGES_REQUESTED" }, { user, state: "APPROVED" }]), false);
  assert.equal(hasBlockingReview([{ user: { login: "bot", type: "Bot" }, state: "CHANGES_REQUESTED" }]), false);
});
