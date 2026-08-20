import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const errors = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
for (const file of files.filter((name) => name.endsWith(".mjs"))) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", shell: false });
  if (result.status !== 0) errors.push(`${path.relative(root, file)}: ${result.stderr.trim()}`);
}

for (const file of files.filter((name) => name.endsWith(".md"))) {
  const relative = path.relative(root, file);
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split("\n");
  const headings = [];
  let fences = 0;
  let inFence = false;
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) errors.push(`${relative}:${index + 1}: trailing whitespace`);
    if (line.includes("https://github.com/FrogDar/")) errors.push(`${relative}:${index + 1}: obsolete repository URL`);
    if (/^```/.test(line)) {
      fences += 1;
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const heading = line.match(/^(#{1,6})\s+\S/);
    if (heading) headings.push({ level: heading[1].length, line: index + 1 });
  });
  const isPullRequestTemplate = relative.startsWith(path.join(".github", "PULL_REQUEST_TEMPLATE"));
  if (!isPullRequestTemplate && headings[0]?.level !== 1) errors.push(`${relative}: first heading must be H1`);
  if (!isPullRequestTemplate && headings.filter((heading) => heading.level === 1).length !== 1) errors.push(`${relative}: exactly one H1 is required`);
  headings.slice(1).forEach((heading, index) => {
    if (heading.level > headings[index].level + 1) errors.push(`${relative}:${heading.line}: heading level jumps from H${headings[index].level} to H${heading.level}`);
  });
  if (fences % 2 !== 0) errors.push(`${relative}: unbalanced fenced code block`);

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#", 1)[0].split("?", 1)[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) errors.push(`${relative}: broken local link ${match[1]}`);
  }
}

const workflowDirectory = path.join(root, ".github", "workflows");
if (fs.existsSync(workflowDirectory)) {
  for (const file of walk(workflowDirectory).filter((name) => /\.ya?ml$/.test(name))) {
    const relative = path.relative(root, file);
    const source = fs.readFileSync(file, "utf8");
    for (const [index, line] of source.split("\n").entries()) {
      const uses = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
      if (uses && !uses[1].startsWith("./") && !/@[0-9a-f]{40}$/.test(uses[1])) {
        errors.push(`${relative}:${index + 1}: action must be pinned to a full commit SHA`);
      }
    }
    if (!/^permissions:/m.test(source)) errors.push(`${relative}: explicit permissions block is required`);
    if (/pull_request_target:/.test(source)) {
      const forbidden = [
        /github\.event\.pull_request\.head\.sha/,
        /github\.event\.pull_request\.head\.ref/,
        /gh\s+pr\s+checkout/,
        /git\s+(?:fetch|checkout).*pull/,
        /npm\s+(?:install|ci)/,
      ];
      for (const pattern of forbidden) {
        if (pattern.test(source)) errors.push(`${relative}: privileged workflow contains unsafe pattern ${pattern}`);
      }
      if (/uses:\s*actions\/checkout@/.test(source) && !/persist-credentials:\s*false/.test(source)) {
        errors.push(`${relative}: privileged checkout must disable persisted credentials`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Source checks passed for ${files.length} files.`);
}
