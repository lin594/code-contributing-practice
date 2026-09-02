# 第 5 课：响应 Code Review

Review 不是考试判分，而是围绕同一组变化交换上下文并共同改进结果。本关机器人一定会提出一次修改要求；你要保留原 PR，在同一 head branch 继续 commit、push，并用评论说明处理结果。

预计 20 分钟。必须先完成 Exercise 4。

## 先理解：PR 会跟着 head branch 更新

PR 不是某一条 commit 的静态副本。只要向它的 head branch push 新 commit，Conversation、Commits、Files changed 和 Checks 都会更新，原来的 Review 上下文仍然存在。

预测一下：收到 Review 后关闭 PR、创建一个新 PR 会丢掉什么？评审者将失去原讨论、修改前后关联和“反馈是否落实”的连续记录。

## 1. 提交初稿

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 5 · 响应 Code Review**，建立新分支。

把 workspace 中的 TODO 换成一段简短初稿，保留 `状态：初稿`，提交并 push：

```bash
git add .practice/workspace.md
git commit -m "docs: draft exercise 5 response"
git push -u origin exercise/5-ISSUE_NUMBER
```

使用机器人链接创建普通 PR。第一次 `Practice / Grade` 显示等待修改是本关设计，不要重新运行检查，也不要创建另一个分支。

## 2. 阅读反馈，再修改原分支

把反馈先复述成待办：

1. 状态改为 `状态：已根据反馈修改`；
2. 删除所有 `TODO`；
3. 新增 `## 修改说明`；
4. 写清具体改了什么。

在当前分支完成后检查并提交：

```bash
git status
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: address exercise 5 review"
git push
```

这次不需要 `-u`，因为第一个 push 已建立跟踪关系。刷新原 PR，确认 **Commits** 增加一条，**Files changed** 显示相对 base 的最终变化。

## 3. 回复 Review

在 PR 评论中写一条可验证的回复，例如：

```text
已把状态改为“已根据反馈修改”，并新增“修改说明”解释具体变化；Files changed 中已无 TODO。
```

回复不是只写“done”。它应指出处理了什么、在哪里能看到结果。如果机器人在新 commit 后先提示“尚未回复”，直接评论即可；评论会触发复查，不需要制造空 commit。

## 通过后你应能解释

- 为什么修复 Review 要更新原分支，而不是新建 PR？
- 如何确认 `git push` 更新了正确的 PR？
- 好的 Review 回复为什么要说明验证位置？

然后进入[第 6 课：同步上游更新](06-sync-upstream.md)。
