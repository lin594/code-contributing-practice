import assert from "node:assert/strict";
import test from "node:test";
import { parseFeedbackState, renderFeedback, replaceFeedbackState } from "../../scripts/practice/feedback.mjs";

test("feedback state round trips through an inert HTML marker", () => {
  const state = { revisionRequestedSha: "abc123", text: "`$(touch nope)` | 中文" };
  const body = renderFeedback({ outcome: "pass", headSha: "1234567890abcdef", session: { exercise: 3 }, warnings: 1, results: [], nextActions: ["继续"] }, state);
  assert.deepEqual(parseFeedbackState(body), state);
  assert.match(body, /Warning 不阻止合并/);
});

test("feedback escapes table delimiters and newlines", () => {
  const body = renderFeedback({ outcome: "fail", headSha: "1234567890abcdef", session: { exercise: 1 }, warnings: 0, results: [{ id: "unsafe|id", level: "required", status: "fail", summary: "line1\nline2 | <details>", remediation: "use `code`" }], nextActions: ["fix"] });
  assert.match(body, /unsafe\\\|id/);
  assert.match(body, /line1 line2 \\\| &lt;details&gt;/);
});

test("feedback state can be updated without changing the visible report", () => {
  const body = renderFeedback({ outcome: "fail", headSha: "1234567890abcdef", session: { exercise: 9 }, warnings: 0, results: [], nextActions: ["read logs"] }, { ciFailureObservedSha: "old" });
  const replaced = replaceFeedbackState(body, { ciFailureObservedSha: "old", ciPassedSha: "new" });
  assert.deepEqual(parseFeedbackState(replaced), { ciFailureObservedSha: "old", ciPassedSha: "new" });
  assert.equal(replaced.replace(/<!--[^>]+-->/, ""), body.replace(/<!--[^>]+-->/, ""));
  assert.throws(() => replaceFeedbackState("no marker", {}), /marker is missing/);
});
