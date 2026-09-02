import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { upstreamMutation, workspaceTemplate } from "../../scripts/practice/session.mjs";

function git(cwd, args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (!allowFailure && result.status !== 0) {
    assert.fail(`git ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  }
  return result;
}

function scenario(exercise, learnerEdit) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `practice-ex${exercise}-`));
  fs.mkdirSync(path.join(directory, ".practice"));
  git(directory, ["init", "-b", "base"]);
  git(directory, ["config", "user.name", "Practice Test"]);
  git(directory, ["config", "user.email", "practice@example.invalid"]);
  const workspace = path.join(directory, ".practice/workspace.md");
  fs.writeFileSync(workspace, workspaceTemplate(exercise));
  git(directory, ["add", ".practice/workspace.md"]);
  git(directory, ["commit", "-m", "chore: create practice base"]);

  git(directory, ["switch", "-c", "learner"]);
  fs.writeFileSync(workspace, learnerEdit(fs.readFileSync(workspace, "utf8")));
  git(directory, ["add", ".practice/workspace.md"]);
  git(directory, ["commit", "-m", "docs: add learner change"]);

  git(directory, ["switch", "base"]);
  const mutation = upstreamMutation(exercise);
  assert.ok(mutation);
  fs.writeFileSync(workspace, fs.readFileSync(workspace, "utf8").replace(mutation.before, mutation.after));
  git(directory, ["add", ".practice/workspace.md"]);
  git(directory, ["commit", "-m", mutation.message]);
  const upstreamSha = git(directory, ["rev-parse", "HEAD"]).stdout.trim();
  git(directory, ["switch", "learner"]);
  return { directory, workspace, mutation, upstreamSha };
}

for (const [exercise, edit] of [
  [6, (content) => content.replace("个人笔记：TODO", "个人笔记：fetch 获取，merge 负责整合。")],
  [8, (content) => content
    .replace("TODO：说明这次改动为谁解决什么问题。", "帮助同学检查协作流程。")
    .replace("TODO：写出你检查过的内容。", "已检查 diff 和提交历史。")],
]) {
  test(`exercise ${exercise} upstream and learner edits merge without conflict`, (t) => {
    const state = scenario(exercise, edit);
    t.after(() => fs.rmSync(state.directory, { recursive: true, force: true }));
    const merge = git(state.directory, ["merge", "base", "--no-edit"], { allowFailure: true });
    assert.equal(merge.status, 0, `${merge.stdout}${merge.stderr}`);
    const content = fs.readFileSync(state.workspace, "utf8");
    assert.match(content, new RegExp(state.mutation.after));
    assert.equal(git(state.directory, ["merge-base", "--is-ancestor", state.upstreamSha, "HEAD"], { allowFailure: true }).status, 0);
  });
}

test("exercise 7 creates a real conflict that can preserve both intentions", (t) => {
  const state = scenario(7, (content) => content.replace("最终内容：待填写", "最终内容：我的修改"));
  t.after(() => fs.rmSync(state.directory, { recursive: true, force: true }));
  const merge = git(state.directory, ["merge", "base", "--no-edit"], { allowFailure: true });
  assert.notEqual(merge.status, 0);
  assert.match(fs.readFileSync(state.workspace, "utf8"), /<<<<<<< HEAD[\s\S]*我的修改[\s\S]*上游更新[\s\S]*>>>>>>>/);

  fs.writeFileSync(state.workspace, "# 解决上游冲突\n\n## 最终决定\n\n最终内容：上游更新 + 我的修改\n");
  git(state.directory, ["add", ".practice/workspace.md"]);
  git(state.directory, ["commit", "-m", "docs: resolve upstream conflict"]);
  assert.equal(git(state.directory, ["merge-base", "--is-ancestor", state.upstreamSha, "HEAD"], { allowFailure: true }).status, 0);
});
