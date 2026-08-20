export function assertMergeEligible({ report, input, expectedHead }) {
  if (report.outcome !== "pass" || !input?.session) {
    throw new Error("PR no longer passes the practice rules");
  }
  if (!expectedHead || report.headSha !== expectedHead) {
    throw new Error("PR head changed after grading; refusing stale merge");
  }
  return true;
}

export function canInjectConflict({ pr, manifest, referencedIssues }) {
  return (
    manifest?.exercise === 4 &&
    !manifest.conflictBaseSha &&
    pr?.base?.ref === manifest.baseBranch &&
    pr?.user?.login?.toLowerCase() === manifest.actor?.toLowerCase() &&
    referencedIssues.includes(manifest.issueNumber)
  );
}

export function hasBlockingReview(reviews) {
  const blocked = new Map();
  for (const review of reviews) {
    if (review.user?.type === "Bot") continue;
    const login = review.user?.login;
    if (!login) continue;
    if (review.state === "CHANGES_REQUESTED") blocked.set(login, true);
    if (["APPROVED", "DISMISSED"].includes(review.state)) blocked.set(login, false);
  }
  return [...blocked.values()].some(Boolean);
}

export function expiryDecision(lastActivity, { now = Date.now(), remindAfterDays = 10, expireAfterDays = 14 } = {}) {
  const timestamp = Date.parse(lastActivity);
  if (!Number.isFinite(timestamp)) throw new Error("lastActivity must be an ISO date");
  const inactiveDays = (now - timestamp) / 86_400_000;
  if (inactiveDays >= expireAfterDays) return { action: "expire", inactiveDays };
  if (inactiveDays >= remindAfterDays) return { action: "remind", inactiveDays };
  return { action: "none", inactiveDays };
}
