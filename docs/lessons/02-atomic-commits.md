# 第 2 课：暂存区与原子提交

本关把“会 commit”升级为“会组织 commit”。你会按顺序完成两件小事，每件事各保存为一条 commit，让评审者可以独立理解、定位或撤销。

预计 20 分钟。必须先完成 Exercise 1。

## 先理解：commit 是给未来读者的解释单位

一条好的 commit 通常只表达一个目的。它不是按时间随手保存的压缩包，也不是“今天做过的一切”。清楚的历史能回答：改了什么、为什么改、哪一条引入了问题。

暂存区让你选择下一条 commit 的边界。本关不要求使用 `git add -p`；为了降低难度，你会先编辑第一部分并提交，再编辑第二部分并提交。

预测一下：如果一开始就填完两个 TODO、一次 `git add`，能得到两条有意义的 commit 吗？不能，因为第一条 commit 已经包含了两件事，第二条没有独立变化可保存。

## 1. 开始新会话和新分支

在 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 2 · 暂存区与原子提交**。机器人只会在上一关完成后创建会话。

复制机器人给出的 `fetch` 和 `switch -c` 命令。不要复用 Exercise 1 分支。检查：

```bash
git status
git log --oneline -3
```

## 2. 创建第一条 commit

只填写 `.practice/workspace.md` 中的“我学到的 Git 命令”，保留第二个 TODO。然后：

```bash
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: record a useful Git command"
```

`git diff --staged` 应只包含第一部分。commit 后先不要 push，也不要修改第一条 commit。

## 3. 创建第二条 commit

现在填写“为什么要保持提交历史干净”，再执行：

```bash
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: explain clean commit history"
git log --oneline -2
```

历史顶部应恰好是你刚创建的两条 commit，且每条说明不同目的。

## 4. push 和创建 PR

```bash
git push -u origin exercise/2-ISSUE_NUMBER
```

使用机器人链接创建 PR，在 **Commits** 标签确认恰好两条，在 **Files changed** 确认只有 workspace。标题和 Issue 关联在本关仍会作为建议反馈；先读懂 Warning，不必为了格式盲目重写历史。

## 如果不小心多了一条 commit

对新生最安全的做法是保留当前分支作为参考，从机器人 base 建立一个新本地分支，按本课顺序重新做；不要删除 Fork 或 Issue。熟悉历史后才考虑交互式 rebase。具体命令见[“commit 数量不正确”](../troubleshooting.md#commit-数量不正确)。

## 通过后你应能解释

- `git diff` 和 `git diff --staged` 分别看哪里？
- 为什么两条 commit 不等于随意 commit 两次？
- 怎样在 commit 前发现自己暂存了无关文件？

然后进入[第 3 课：清晰地发起协作](03-clear-collaboration.md)。
