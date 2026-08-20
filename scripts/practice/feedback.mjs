import { ADVISORY, FEEDBACK_MARKER, REQUIRED } from "./constants.mjs";

function escapeCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replaceAll("`", "\\`");
}

function icon(status) {
  return { pass: "✅", fail: "❌", warn: "⚠️", pending: "⏳" }[status] ?? "•";
}

function table(items) {
  if (!items.length) return "_无_";
  const rows = items.map((item) => `| ${icon(item.status)} | \`${escapeCell(item.id)}\` | ${escapeCell(item.summary)} | ${escapeCell(item.remediation || "—")} |`);
  return ["| 结果 | 检查项 | 说明 | 怎么做 |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

export function encodeFeedbackState(state = {}) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

export function parseFeedbackState(body = "") {
  const match = body.match(/<!-- practice-feedback:v1:([A-Za-z0-9_-]+) -->/);
  if (!match) return {};
  try {
    return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

export function renderFeedback(report, state = {}) {
  const required = report.results.filter((item) => item.level === REQUIRED);
  const advisory = report.results.filter((item) => item.level === ADVISORY);
  const passed = report.outcome === "pass";
  const heading = report.outcome === "maintenance"
    ? "## 🤖 维护 PR 自动建议"
    : `## 🤖 练习 ${report.session.exercise} 自动反馈`;
  const summary = report.outcome === "maintenance"
    ? "这个 PR 需要维护者 Review，不会自动合并。"
    : passed
      ? report.warnings
        ? "**练习已通过。** 以下 Warning 不阻止合并，但能帮助你适应真实开源仓库。"
        : "**练习已通过。** 机器人将自动完成合并和清理。"
      : "**练习尚未通过。** 请先处理“必须修复”中的失败项。";
  const next = report.nextActions.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return `<!-- ${FEEDBACK_MARKER}:${encodeFeedbackState(state)} -->
${heading}

${summary}

### 必须修复

${table(required)}

### 改进建议

${table(advisory)}

### 下一步

${next}

<sub>反馈对应 head \`${report.headSha.slice(0, 12)}\`，更新当前分支后机器人会编辑这条评论。</sub>
`;
}
