# 第 3 课：清晰地发起协作

代码或文档只是 PR 的一半；另一半是帮助陌生评审者快速建立上下文。本关开始，清楚的 branch、Issue 关联、PR 标题和说明会从 Warning 升级为必须项。

预计 15 分钟。必须先完成 Exercise 2。

## 四种信息各自回答什么

- branch name：这条工作线在做什么，例如 `exercise/3-42`；
- Issue：为什么需要这项工作，讨论和范围在哪里；
- PR title：结果是什么，列表中能否一眼识别；
- PR body：具体做了什么，评审者如何验证。

`Closes #42` 不只是普通文字。默认分支 PR 合入后，GitHub 可以据此关闭 Issue。本课程 PR 合入临时 base，所以机器人会代为关闭，但写法与真实项目一致。

预测一下：标题只写“修改”，评审者需要打开哪些页面才能猜出目的？清晰标题是在节省团队所有人的切换成本。

## 1. 创建会话并填写 workspace

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 3 · 清晰地发起协作**，使用机器人命令建立 `exercise/3-ISSUE_NUMBER`。

填写 workspace 的两部分：

- **变更目的**：这项变化为谁解决什么问题；
- **验证方式**：评审者怎样确认结果符合目标。

然后检查并提交：

```bash
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: explain exercise 3 change"
git push -u origin exercise/3-ISSUE_NUMBER
```

## 2. 写一份可评审的 PR

使用机器人链接，确认 base/head 后填写：

```text
标题：docs: complete exercise 3

我完成了：补充变更目的和验证方式
Closes #你的 Issue 编号
```

不要把示例编号 `42` 原样复制。提交前打开 **Files changed** 自己读一遍 diff：如果你是第一次见到这个任务的人，能否只凭标题、正文和 diff 理解它？

本关自动检查会要求：

- head 不是 `main`/`master`，且名称以 `exercise/`、`docs/`、`feat/` 或 `fix/` 开头；
- 标题使用 `type: summary` 形式且长度合理；
- 正文包含正确的 `Closes #...`；
- “我完成了”不是空白；
- workspace 的目的和验证方式都已填写。

## 通过后你应能解释

- Issue 和 PR 的角色为什么不同？
- 标题、正文和 commit message 为什么不应该互相替代？
- `Closes` 中的编号属于哪个仓库？

然后进入[第 4 课：Draft Pull Request](04-draft-pull-request.md)。
