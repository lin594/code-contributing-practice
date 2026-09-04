import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  formatGitHubAnnotations,
  formatLinkFailures,
  validateMarkdownLinks,
} from "../../scripts/practice/markdown-links.mjs";
import { workspaceTemplate } from "../../scripts/practice/session.mjs";

test("markdown link validation accepts existing, anchor and external links", async () => {
  const checked = [];
  const result = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: [
      "# CI lab",
      "",
      "[贡献指南](../CONTRIBUTING.md)",
      "[带标题](../CONTRIBUTING.md \"贡献说明\")",
      "[页内标题](#ci-lab)",
      "[GitHub](https://github.com)",
      "[邮件](mailto:teacher@example.com)",
    ].join("\n"),
    exists: async (target) => {
      checked.push(target);
      return target === "CONTRIBUTING.md";
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(checked, ["CONTRIBUTING.md", "CONTRIBUTING.md"]);
});

test("markdown link validation reports the logical file, exact line and resolved target", async () => {
  const result = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: "# CI lab\n\n[贡献指南](../docs/contributing.md)\n",
    exists: async () => false,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.problems, [{
    href: "../docs/contributing.md",
    line: 3,
    reason: "target does not exist",
    sourcePath: ".practice/workspace.md",
    target: "docs/contributing.md",
  }]);
  assert.match(formatLinkFailures(result), /\.practice\/workspace\.md:3/);
  assert.match(formatLinkFailures(result), /docs\/contributing\.md/);
  assert.match(formatGitHubAnnotations(result), /file=\.practice\/workspace\.md,line=3/);
});

test("markdown link validation rejects paths that escape the repository", async () => {
  let checked = false;
  const result = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: "[secret](../../outside.txt)",
    exists: async () => {
      checked = true;
      return true;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.problems[0].reason, "link resolves outside the repository");
  assert.equal(checked, false);
});

test("local and GitHub output describe the same actionable failure", async () => {
  const result = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: "[broken](missing%20file.md)",
    exists: async () => false,
  });
  const local = formatLinkFailures(result);
  const annotations = formatGitHubAnnotations(result);

  assert.match(local, /missing file\.md/);
  assert.match(local, /target does not exist/);
  assert.match(annotations, /missing file\.md/);
  assert.match(annotations, /target does not exist/);
});

test("the local CLI returns success and failure exit codes", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "practice-ci-lab-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const script = fileURLToPath(new URL("../../scripts/practice/markdown-links.mjs", import.meta.url));
  fs.writeFileSync(path.join(directory, "target.md"), "# Target\n");
  fs.writeFileSync(path.join(directory, "workspace.md"), "[target](target.md)\n");

  const passing = spawnSync(process.execPath, [script, "workspace.md"], { cwd: directory, encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stderr);
  assert.match(passing.stdout, /PASS workspace\.md/);

  fs.writeFileSync(path.join(directory, "workspace.md"), "[missing](missing.md)\n");
  const failing = spawnSync(process.execPath, [script, "workspace.md"], { cwd: directory, encoding: "utf8" });
  assert.equal(failing.status, 1);
  assert.match(failing.stderr, /FAIL workspace\.md:1/);
  assert.match(failing.stderr, /npm run check:ci-lab/);
});

test("exercise 9 starts with the planned broken link and has a discoverable repair", async () => {
  const exists = async (target) => target === "CONTRIBUTING.md";
  const initial = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: workspaceTemplate(9).replace("学习者：TODO", "学习者：octocat"),
    exists,
  });
  assert.equal(initial.ok, false);
  assert.equal(initial.problems[0].line, 4);
  assert.equal(initial.problems[0].target, "docs/contributing.md");

  const repaired = await validateMarkdownLinks({
    sourcePath: ".practice/workspace.md",
    content: workspaceTemplate(9).replace("../docs/contributing.md", "../CONTRIBUTING.md"),
    exists,
  });
  assert.equal(repaired.ok, true);
});
