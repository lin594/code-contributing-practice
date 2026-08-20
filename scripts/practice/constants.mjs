export const SCHEMA_VERSION = 1;
export const SESSION_FILE = ".practice/session.json";
export const WORKSPACE_FILE = ".practice/workspace.md";
export const FEEDBACK_MARKER = "practice-feedback:v1";
export const SESSION_MARKER = "practice-session:v1";

export const REQUIRED = "required";
export const ADVISORY = "advisory";

export const EXERCISE_LABELS = new Map([
  [1, "exercise:1"],
  [2, "exercise:2"],
  [3, "exercise:3"],
  [4, "exercise:4"],
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
export const SESSION_BRANCH = /^practice\/ex([1-4])\/issue-(\d+)-([A-Za-z0-9-]{1,39})$/;
