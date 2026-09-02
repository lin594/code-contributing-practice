# 八关练习与验收规则

本页是规则索引，不代替逐步教程。第一次做某关时，请从[学习地图](learning-path.md)进入对应 lesson。

## 所有关卡的共同边界

- 从本人创建的 Exercise Issue 开始，并按顺序解锁；
- base 必须是机器人提供的 `practice/ex...` 临时分支；
- head 必须是本人 Fork 中的独立 topic branch，不能是 `main`/`master`；
- 只修改 `.practice/workspace.md`，不要修改 `session.json`；
- PR 最终必须是 Ready for review，且没有人工 Changes requested 或 `automerge:disabled`；
- 修复反馈时继续更新原 PR，不要重新创建会话。

Commit message 推荐 `type: summary`，例如 `docs: add sync notes`。第 1–2 关中，PR 标题、分支名和 Issue 关联不规范只产生 Warning；从第 3 关起，这些协作信息成为累计必需项。

## Exercise 1：第一次 Pull Request

**学习目标：** 完成 Fork、branch、edit、stage、commit、push 和 PR 的完整闭环。

**通过条件：**

- workspace 两处 TODO 都已填写，GitHub 用户名与当前账号一致；
- PR 相对 base 恰好一条普通 commit；
- 没有 merge commit 或额外文件。

教程：[第 1 课](lessons/01-first-pull-request.md)

## Exercise 2：暂存区与原子提交

**学习目标：** 用暂存区把两个目的拆成两条清晰、线性的 commit。

**通过条件：**

- 第一条 commit 填写“我学到的 Git 命令”；
- 第二条 commit 填写“为什么要保持提交历史干净”；
- PR 相对 base 恰好两条 commit，且没有 merge commit。

教程：[第 2 课](lessons/02-atomic-commits.md)

## Exercise 3：清晰地发起协作

**学习目标：** 让不了解背景的评审者能够从 branch、Issue 和 PR 信息理解改动。

**通过条件：**

- workspace 的“变更目的”和“验证方式”都已填写；
- head branch 使用 `exercise/`、`docs/`、`feat/` 或 `fix/` 前缀；
- PR 标题使用清楚的 `type: summary` 形式；
- PR 正文填写“我完成了”，并包含当前 Issue 的 `Closes #编号`；
- 不包含 merge commit。

教程：[第 3 课](lessons/03-clear-collaboration.md)

## Exercise 4：Draft Pull Request

**学习目标：** 用 Draft 分享未完成工作，并在作者自查后正式请求评审。

**通过条件：**

- 机器人曾在自动反馈状态中观察到 PR 是 Draft；
- 最终 PR 已点击 Ready for review；
- workspace 保留 `状态：可以评审` 并填写完成标准；
- 不包含 merge commit。

第一次 Draft 检查为红灯是预期行为。不要先创建普通 PR 再立刻转 Draft；先 Draft、检查后再 Ready。

教程：[第 4 课](lessons/04-draft-pull-request.md)

## Exercise 5：响应 Code Review

**学习目标：** 在同一 PR 中接收反馈、提交修改并留下可验证回复。

**通过条件：**

- 第一次检查后，原 head 出现新的 commit SHA；
- 状态改为 `已根据反馈修改`，新增“修改说明”，没有 TODO；
- 在 PR 评论中说明修改和验证结果；
- 不包含 merge commit。

教程：[第 5 课](lessons/05-review.md)

## Exercise 6：同步上游更新

**学习目标：** 区分 fetch 与整合，并在无冲突场景使用 merge 或 rebase。

**通过条件：**

- head 历史包含机器人注入的可信上游 commit；
- workspace 同时包含 `课程公告：上游已更新` 和完整个人笔记；
- 结果无 TODO。

只手工输入“上游已更新”不会通过祖先关系检查。

教程：[第 6 课](lessons/06-sync-upstream.md)

## Exercise 7：解决合并冲突

**学习目标：** 理解同一行竞争变化，作出内容决定并完成 merge/rebase。

**通过条件：**

- head 历史包含机器人注入的可信上游 commit；
- 最终内容同时保留“上游更新”和“我的修改”；
- 文件中没有冲突标记。

教程：[第 7 课](lessons/07-conflicts.md)

## Exercise 8：协作综合练习

**学习目标：** 在上游和 Review 都变化时，持续维护一份可评审 PR。

**通过条件：**

- 第 3 关开始累积的 branch、标题、Issue 关联和 PR 说明均合格；
- head 包含机器人写入的协作约定；
- Review 后 head SHA 发生变化，状态改为 `已完成协作修订`；
- workspace 包含变更目的、自测结果和“Review 回复”，无 TODO；
- PR 中有本人对 Review 的说明性评论。

教程：[第 8 课](lessons/08-capstone.md)

## 自动完成后发生什么

通过后机器人会使用已判定的 exact head SHA 执行 squash merge，随后关闭 Exercise Issue 并删除临时上游 base。你的 Fork branch 和本地 branch 仍由你控制；确认 PR 显示 **Merged** 后可以保留作学习记录，也可以按[速查表](git-cheatsheet.md#完成后的可选清理)逐个清理。
