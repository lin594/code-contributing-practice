# 第 4 课：Draft Pull Request

Draft PR 用于尽早分享方向、保存讨论上下文，但明确告诉团队“还没有准备好正式评审”。本关会先创建 Draft，再检查 diff 和完成标准，最后转成 Ready for review。

预计 15 分钟。必须先完成 Exercise 3。

## 先理解：Draft 不是另一个分支

Draft 和普通 PR 比较的仍是同一对 base/head；变化的是协作状态。Draft 不能被合并，也通常不会自动请求代码所有者评审。点击 **Ready for review** 后，原 PR、评论、链接和分支都保留。

预测一下：如果工作还没完成却创建普通 PR，评审者可能浪费时间指出你正准备修的问题；如果一直保留 Draft，又会让团队不知道何时可以开始。

## 1. 准备内容

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 4 · Draft Pull Request**，建立机器人给出的分支。

workspace 已写好 `状态：可以评审`，你只需把 TODO 改为一条明确的完成标准。例如：

```text
说明同时包含变更目的和可重复的验证步骤。
```

提交并 push：

```bash
git add .practice/workspace.md
git diff --staged
git commit -m "docs: define review readiness"
git push -u origin exercise/4-ISSUE_NUMBER
```

## 2. 必须先创建 Draft

打开机器人提供的 PR 链接。填写正文后，不要直接点击默认的创建按钮；使用按钮旁的下拉选项，选择 **Create draft pull request**。

第一次自动检查出现红灯或等待是预期行为：`pr.ready` 会说明 Draft 不能完成练习，同时机器人在隐藏状态中记录它确实见过 Draft。不要为此创建第二个 PR。

## 3. 做作者自查，再请求评审

在原 PR 页面依次查看：

1. **Conversation**：目标、Issue 关联和自动反馈是否清楚；
2. **Commits**：是否只有本关需要的提交；
3. **Files changed**：是否只改 workspace，diff 是否符合完成标准；
4. **Checks**：失败是否仅来自“尚未 Ready”。

确认后点击 PR 页面底部的 **Ready for review**。这个动作会触发新检查，不需要再 commit。机器人同时看到“曾是 Draft”和“现在可评审”后才会通过。

## 通过后你应能解释

- Draft 改变的是代码历史，还是 PR 的协作状态？
- 什么时候应该尽早开 Draft，什么时候不必？
- 转为 Ready 前，作者应该自己检查哪几个标签页？

然后进入[第 5 课：响应 Code Review](05-review.md)。
