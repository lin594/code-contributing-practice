#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function markdownDestinations(content) {
  const links = [];
  const pattern = /!?\[[^\]\n]*\]\(\s*([^\n)]*?)\s*\)/g;
  for (const match of String(content).matchAll(pattern)) {
    const destination = match[1].trim();
    const href = destination.startsWith("<")
      ? destination.slice(1, destination.indexOf(">") < 0 ? undefined : destination.indexOf(">"))
      : destination.split(/\s+/, 1)[0];
    if (!href || href.startsWith("#") || href.startsWith("//") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(href)) continue;
    links.push({ href, line: lineNumberAt(content, match.index) });
  }
  return links;
}

function resolveRepositoryPath(sourcePath, href) {
  const withoutFragment = href.split("#", 1)[0].split("?", 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(withoutFragment);
  } catch {
    return { reason: "link contains invalid percent encoding", target: withoutFragment };
  }
  if (path.posix.isAbsolute(decoded)) return { reason: "repository-local links must be relative", target: decoded };
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), decoded));
  if (target === ".." || target.startsWith("../")) {
    return { reason: "link resolves outside the repository", target };
  }
  return { target };
}

export async function validateMarkdownLinks({ sourcePath, content, exists }) {
  if (!sourcePath || typeof exists !== "function") throw new Error("sourcePath and exists are required");
  const problems = [];
  for (const link of markdownDestinations(content)) {
    const resolved = resolveRepositoryPath(sourcePath, link.href);
    if (resolved.reason) {
      problems.push({ ...link, ...resolved, sourcePath });
      continue;
    }
    if (!(await exists(resolved.target))) {
      problems.push({ ...link, ...resolved, reason: "target does not exist", sourcePath });
    }
  }
  return { ok: problems.length === 0, problems };
}

export function formatLinkFailures(result) {
  return result.problems.map((problem) => [
    `FAIL ${problem.sourcePath}:${problem.line} — ${problem.href}`,
    `  Resolved path: ${problem.target}`,
    `  Reason: ${problem.reason}`,
  ].join("\n")).join("\n");
}

function escapeWorkflowProperty(value) {
  return String(value)
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll(":", "%3A")
    .replaceAll(",", "%2C");
}

function escapeWorkflowMessage(value) {
  return String(value).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}

export function formatGitHubAnnotations(result) {
  return result.problems.map((problem) => {
    const properties = `file=${escapeWorkflowProperty(problem.sourcePath)},line=${problem.line},title=Broken local Markdown link`;
    const message = `${problem.href} resolves to ${problem.target}: ${problem.reason}`;
    return `::error ${properties}::${escapeWorkflowMessage(message)}`;
  }).join("\n");
}

async function runLocal() {
  const input = process.argv[2] ?? ".practice/workspace.md";
  const absolute = path.resolve(input);
  const sourcePath = path.relative(process.cwd(), absolute).split(path.sep).join("/");
  let content;
  try {
    content = await fs.readFile(absolute, "utf8");
  } catch (error) {
    console.error(`Cannot read ${sourcePath}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const result = await validateMarkdownLinks({
    sourcePath,
    content,
    exists: async (target) => {
      try {
        return (await fs.stat(path.resolve(target))).isFile();
      } catch {
        return false;
      }
    },
  });
  if (!result.ok) {
    console.error(formatLinkFailures(result));
    console.error("\nReproduce locally: npm run check:ci-lab");
    process.exitCode = 1;
    return;
  }
  console.log(`PASS ${sourcePath} — all local Markdown links resolve to files.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await runLocal();
