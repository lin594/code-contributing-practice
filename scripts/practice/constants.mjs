export const SCHEMA_VERSION = 2;
export const EXERCISE_COUNT = 8;
export const SESSION_FILE = ".practice/session.json";
export const WORKSPACE_FILE = ".practice/workspace.md";
export const FEEDBACK_MARKER = "practice-feedback:v1";
export const SESSION_MARKER = "practice-session:v1";
export const COMPLETION_MARKER = "practice-completion:v2";

export const REQUIRED = "required";
export const ADVISORY = "advisory";

export const EXERCISE_LABELS = new Map([
  [1, "exercise:1"],
  [2, "exercise:2"],
  [3, "exercise:3"],
  [4, "exercise:4"],
  [5, "exercise:5"],
  [6, "exercise:6"],
  [7, "exercise:7"],
  [8, "exercise:8"],
]);

export const EXERCISE_TITLES = new Map([
  [1, "第一次 Pull Request"],
  [2, "暂存区与原子提交"],
  [3, "清晰地发起协作"],
  [4, "Draft Pull Request"],
  [5, "响应 Code Review"],
  [6, "同步上游更新"],
  [7, "解决合并冲突"],
  [8, "协作综合练习"],
]);

export const EXERCISE_LESSONS = new Map([
  [1, "docs/lessons/01-first-pull-request.md"],
  [2, "docs/lessons/02-atomic-commits.md"],
  [3, "docs/lessons/03-clear-collaboration.md"],
  [4, "docs/lessons/04-draft-pull-request.md"],
  [5, "docs/lessons/05-review.md"],
  [6, "docs/lessons/06-sync-upstream.md"],
  [7, "docs/lessons/07-conflicts.md"],
  [8, "docs/lessons/08-capstone.md"],
]);

export const STATUS_LABELS = [
  "session:active",
  "session:blocked",
  "session:needs-fix",
  "session:ready",
  "session:completed",
  "session:expired",
];

export const ALL_MANAGED_LABELS = [
  ...EXERCISE_LABELS.values(),
  ...STATUS_LABELS,
  "automerge:disabled",
];

export const CONVENTIONAL_COMMIT = /^(build|ci|docs|feat|fix|perf|refactor|test|style|chore|revert)(\([a-z0-9][a-z0-9-]*\))?: \S.{0,100}$/;
export const CLOSING_REFERENCE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s*#(\d+)\b/gi;
export const SESSION_BRANCH = /^practice\/ex([1-8])\/issue-(\d+)-([A-Za-z0-9-]{1,39})$/;
