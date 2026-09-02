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

test("all eight exercises have metadata, a lesson and an Issue Form", () => {
  assert.equal(EXERCISE_COUNT, 8);
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

test("learner-facing overview no longer advertises the retired four-stage course", () => {
  const files = [
    path.join(root, "README.md"),
    path.join(root, "docs/learning-path.md"),
    path.join(root, "docs/exercises.md"),
  ];
  for (const file of files) assert.doesNotMatch(fs.readFileSync(file, "utf8"), /四关/);
});
