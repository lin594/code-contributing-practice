import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { EXERCISE_COUNT, EXERCISE_LABELS, EXERCISE_LESSONS, EXERCISE_TITLES } from "../../scripts/practice/constants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

test("all nine exercises have metadata, a lesson and an Issue Form", () => {
  assert.equal(EXERCISE_COUNT, 9);
  for (let exercise = 1; exercise <= EXERCISE_COUNT; exercise += 1) {
    assert.ok(EXERCISE_LABELS.get(exercise));
    assert.ok(EXERCISE_TITLES.get(exercise));

    const lesson = path.join(root, EXERCISE_LESSONS.get(exercise));
    const issueForm = path.join(root, `.github/ISSUE_TEMPLATE/exercise-${exercise}.yml`);
    assert.equal(fs.existsSync(lesson), true, `missing lesson for exercise ${exercise}`);
    assert.equal(fs.existsSync(issueForm), true, `missing Issue Form for exercise ${exercise}`);
    assert.match(fs.readFileSync(issueForm, "utf8"), new RegExp(`exercise:${exercise}`));
  }
});

test("local Markdown links in learner-facing documents resolve to files", () => {
  const markdownFiles = [path.join(root, "README.md"), ...filesBelow(path.join(root, "docs"))]
    .filter((file) => file.endsWith(".md") && !file.includes(`${path.sep}plans${path.sep}`));
  const missing = [];
  for (const file of markdownFiles) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const href = match[1].trim();
      if (/^(?:https?:|mailto:|#)/.test(href)) continue;
      const target = decodeURIComponent(href.split(/[?#]/, 1)[0]);
      const resolved = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) missing.push(`${path.relative(root, file)} -> ${href}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("learner-facing overview advertises the nine-stage course", () => {
  const files = [
    path.join(root, "README.md"),
    path.join(root, "docs/learning-path.md"),
    path.join(root, "docs/exercises.md"),
  ];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(content, /四关/);
    assert.match(content, /九关|九个递进关卡/);
  }
});

test("CI lesson and workflow expose the learner-facing check, step and local command", () => {
  const lesson = fs.readFileSync(path.join(root, "docs/lessons/09-ci-diagnostics.md"), "utf8");
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/practice-grade.yml"), "utf8");
  const automation = fs.readFileSync(path.join(root, "scripts/practice/workflow.mjs"), "utf8");
  const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
  for (const phrase of ["Practice / Grade", "Check local Markdown links", "npm run check:ci-lab"]) {
    assert.match(lesson, new RegExp(phrase.replaceAll("/", "\\/")));
  }
  assert.match(workflow, /name: Check local Markdown links/);
  assert.match(workflow, /startsWith\(github\.event\.pull_request\.base\.ref, 'practice\/ex9\/'\)/);
  assert.match(workflow, /name: Record successful CI head/);
  assert.match(workflow, /contents: read[\s\S]*issues: write[\s\S]*pull-requests: read/);
  assert.match(automation, /"exercise:9"/);
  assert.match(automation, /manifest\.exercise < 9/);
  assert.match(packageJson, /"check:ci-lab"/);
});
