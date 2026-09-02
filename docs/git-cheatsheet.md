# Git 速查表

速查表用于“理解过但一时想不起”，不能替代对应 lesson。命令中的 `PATH`、`BRANCH`、`YOUR_PRACTICE_BASE` 和 Issue 编号必须换成实际值。

## 不确定时先看状态

```bash
git status
git branch --show-current
git remote -v
git log --oneline --graph --decorate -8
```

这四条分别回答：文件处于什么状态、当前在哪个分支、远端指向哪里、最近历史怎样连接。

## 查看变化

```bash
git diff                 # 工作区 vs 暂存区
git diff --staged        # 暂存区 vs 当前 commit
git diff BASE...HEAD     # 当前分支相对共同祖先的最终变化
```

## 暂存与提交

```bash
git add PATH
git restore --staged PATH
git commit -m "docs: explain the change"
git log -1 --oneline
```

`git add` 只选择指定路径。优先明确写文件名，不要养成不检查就 `git add .` 的习惯。

## 获取并创建练习分支

```bash
git fetch upstream YOUR_PRACTICE_BASE
git switch -c exercise/NUMBER-ISSUE upstream/YOUR_PRACTICE_BASE
git branch --show-current
```

已有本地分支时：

```bash
git switch EXISTING_BRANCH
```

## push

```bash
git push -u origin NEW_BRANCH   # 第一次 push，并设置跟踪
git push                        # 后续 push
git push --force-with-lease     # 仅限自己已 rebase 的 topic branch
```

不要使用普通 `--force`，不要对 `main` 或共享分支强制 push。

## 同步上游

先获取，再选择一种整合方式：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git merge upstream/YOUR_PRACTICE_BASE
```

或在自己的 topic branch：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git rebase upstream/YOUR_PRACTICE_BASE
git push --force-with-lease
```

## 冲突进行中

```bash
git status
git diff
# 编辑冲突文件，决定最终内容
git add .practice/workspace.md
git commit                 # merge 路线
# 或 git rebase --continue # rebase 路线
```

放弃当前整合、回到开始前：

```bash
git merge --abort
# 或
git rebase --abort
```

## 修正最近一次 commit message

```bash
git commit --amend -m "docs: clearer summary"
git push --force-with-lease  # 仅当旧 commit 已 push 到个人 topic branch
```

格式 Warning 不值得在不理解历史重写时强制 push。

## 恢复指定文件

```bash
git restore PATH           # 丢弃该文件未暂存的变化
git restore --staged PATH  # 取消暂存，保留工作区变化
git reflog                 # 查找近期 HEAD 移动记录
```

先确认精确路径。不要把 `reset --hard` 当作通用恢复命令。

## 完成后的可选清理

确认 PR 页面显示 **Merged**，并切回 `main`：

```bash
git switch main
git push origin --delete exercise/NUMBER-ISSUE
git branch -D exercise/NUMBER-ISSUE
```

最后一条使用 `-D`，因为练习合入的是已被机器人删除的临时 base，本地 `main` 不一定能证明该 branch 已合并。它会删除该本地分支指针，所以务必先核对分支名和 PR 状态；不清理也不影响下一关。
