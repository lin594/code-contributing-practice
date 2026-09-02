# 第 8 课：协作综合练习

最后一关不再引入新命令，而是把清晰 PR、上游同步、Review 修改、评论回复和作者自测组合成一次模拟团队协作。第一次检查不会通过；你需要根据不断变化的共同上下文推进原 PR。

预计 30 分钟。必须先完成 Exercise 7。

## 1. 独立准备可讨论的初稿

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 8 · 协作综合练习**，建立 `exercise/8-ISSUE_NUMBER`。

在 workspace 中：

- 保留 `状态：初稿`；
- 填写“变更目的”，说明为谁解决什么问题；
- 不改“等待维护者补充”的协作约定；
- 填写“自测结果”，说明你检查了什么。

然后完成作者自查：

```bash
git status
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: draft collaboration checklist"
git log -1 --oneline
git push -u origin exercise/8-ISSUE_NUMBER
```

创建 PR 时使用清晰标题，填写“我完成了”，保留正确的 `Closes #...`，并在 **Files changed** 检查范围。

## 2. 接收两种并发变化

PR 创建后，机器人会同时：

1. 在上游 base 补充一条协作约定；
2. 对你的初稿提出 Review 修改要求。

先不要手抄机器人写入的文字。运行：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git merge upstream/YOUR_PRACTICE_BASE
git status
```

本关上游更新与个人内容位于不同位置，应自动合并。也可使用第 6 课学过的 rebase 路线。打开 workspace，确认协作约定已经变为：

```text
协作约定：提交前先同步上游并回应 Review
```

## 3. 落实 Review 并回复

在同一分支继续修改：

- 把状态改为 `状态：已完成协作修订`；
- 确保没有 `TODO`；
- 新增 `## Review 回复`，记录根据反馈改了什么。

```bash
git add .practice/workspace.md
git diff --staged
git commit -m "docs: address capstone review"
git push
```

最后在 PR 评论中说明修改和验证结果。自动检查会同时验证：head 包含机器人写入的可信上游 commit、Review 后出现新 head、workspace 完整、作者留下了回复。评论会触发复查，因此不要创建空 commit 催促机器人。

## 4. 毕业复盘

回看 PR 的 **Conversation**、**Commits**、**Checks** 和 **Files changed**，用自己的话回答：

- 需求上下文、代码历史、自动验证和人工讨论分别保存在哪里？
- 当上游与 Review 同时变化时，为什么先读状态和反馈比盲目复制命令重要？
- 哪些规则来自本课程，哪些应该以目标项目的 CONTRIBUTING 为准？

通过后，你已经具备加入课程小组 GitHub 协作的核心动作。下一步可从[学习地图的“毕业后迁移”](../learning-path.md#毕业后的迁移)开始；在真实仓库先读规则、从小问题入手，并接受维护者可能采用不同的 merge/rebase、commit 和 Review 约定。
