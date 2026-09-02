# 第 7 课：解决合并冲突

冲突不是 Git 损坏，而是两条历史对同一位置提出不同结果，Git 无法替团队做语义决定。本关你和机器人会修改同一行；你必须看懂双方意图，写出最终内容，再继续 merge 或 rebase。

预计 25 分钟。必须先完成 Exercise 6。

## 先理解冲突标记

冲突文件大致会出现：

```text
[当前分支开始：七个小于号 + HEAD]
当前分支中的内容
[分隔线：七个等号]
正在整合的分支内容
[上游结束：七个大于号 + upstream/...]
```

真实文件会用七个连续的小于号、等号和大于号标出三段；这里改用说明文字，避免仓库自检把教学示例误判为尚未解决的冲突。这些标记只是把两边展示给你，不是最终答案。“解决”需要决定最终文件应表达什么，并删除全部标记。不能机械选择 Current 或 Incoming；真实项目中常常要重写成同时满足两边目标的第三种内容。

## 1. 制造真实冲突

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 7 · 解决合并冲突**。建立分支，把：

```text
最终内容：待填写
```

改为：

```text
最终内容：我的修改
```

提交、push 并创建 PR。机器人随后会在上游同一行写入 `最终内容：上游更新`，第一次检查会提示你同步。

## 2. 使用 merge 进入冲突（推荐）

```bash
git fetch upstream YOUR_PRACTICE_BASE
git merge upstream/YOUR_PRACTICE_BASE
git status
```

Git 应报告 `.practice/workspace.md` 为 `both modified`。打开文件，理解两边后把冲突区改成一行：

```text
最终内容：上游更新 + 我的修改
```

确认文件中没有任何冲突标记，再继续：

```bash
git add .practice/workspace.md
git diff --staged
git commit
git push
```

## 可选：使用 rebase

```bash
git fetch upstream YOUR_PRACTICE_BASE
git rebase upstream/YOUR_PRACTICE_BASE
# 编辑为最终内容后
git add .practice/workspace.md
git rebase --continue
git push --force-with-lease
```

rebase 冲突中的 `ours`/`theirs` 视角容易让初学者误解，判断时以文件内容和最终目标为准，不要只凭按钮名称。

## 随时可以安全中止

如果还没有完成整合，可以回到操作前：

```bash
git merge --abort
# 或正在 rebase 时
git rebase --abort
```

中止不是失败，它让你重新阅读 `status` 和教程。不要使用 `reset --hard` 作为通用冲突修复。

## 通过后你应能解释

- Git 为什么无法自动决定这一行？
- 删除冲突标记但漏掉一方内容，算不算正确解决？
- merge/rebase 进行到一半时，哪个命令告诉你下一步？

然后进入[第 8 课：协作综合练习](08-capstone.md)。
