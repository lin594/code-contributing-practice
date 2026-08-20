# 开始指南

本指南以 Git 命令行和 GitHub 网页为主。GitHub Desktop 用户可参考文末对照。

## 1. Fork 和 clone

在仓库页面点击 **Fork**，把仓库复制到自己的 GitHub 账号。然后把 `YOUR_USERNAME` 替换成自己的用户名：

```bash
git clone https://github.com/YOUR_USERNAME/code-contributing-practice.git
cd code-contributing-practice
git remote add upstream https://github.com/lin594/code-contributing-practice.git
git remote -v
```

推荐约定：

- `origin` 指向你自己的 Fork，可以 push；
- `upstream` 指向本训练仓库，用来获取课程和临时训练分支。

如果 `git remote add upstream` 提示 `remote upstream already exists`，说明已经配置过，直接运行 `git remote -v` 检查即可。

## 2. 创建练习 Issue

前往 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose)，选择当前关卡。创建后机器人会：

1. 把 Issue 分配给你；
2. 检查上一关是否完成；
3. 创建专属的 `practice/ex...` 上游分支；
4. 评论本关准确命令和创建 PR 的链接。

不要自行猜测临时分支名，以机器人评论为准。

## 3. 建立 topic branch

把机器人评论中的分支名代入：

```bash
git fetch upstream practice/ex1/issue-123-YOUR_USERNAME
git switch -c exercise/1-123 upstream/practice/ex1/issue-123-YOUR_USERNAME
```

此时 `.practice/` 中会出现两个文件：

- `session.json` 是机器人使用的会话清单，不要修改；
- `workspace.md` 是本关唯一需要修改的文件。

## 4. Commit 和 push

```bash
git status
git add .practice/workspace.md
git commit -m "docs: complete exercise 1"
git push -u origin exercise/1-123
```

Commit message 格式是建议而非硬门槛。命令执行前先用 `git diff` 和 `git diff --staged` 确认自己准备提交什么。

## 5. 创建 Pull Request

优先使用机器人在 Issue 中提供的链接，它会预选临时 base 和练习模板。提交前确认：

- base repository 是 `lin594/code-contributing-practice`；
- base branch 是机器人提供的 `practice/ex...`；
- head repository 是你的 Fork；
- compare branch 是刚才 push 的 topic branch；
- PR 正文包含 `Closes #Issue编号`。

练习 PR 指向非默认分支，GitHub 不会原生关闭 Issue；机器人会检查同样的语法，并在练习合并后代为关闭。真实开源仓库的默认分支 PR 通常会原生完成关联。

## 6. 处理自动反馈

PR 中出现红灯时，不要关闭 PR 或重新创建 PR：

```bash
# 修改文件后
git add .practice/workspace.md
git commit -m "docs: address review feedback"
git push
```

同一 PR 会自动更新，机器人也会编辑原有反馈评论。Warning 不阻止完成，但建议理解和采纳。

通过后，机器人会自动 squash merge、关闭 Issue 并删除上游临时分支。你可以删除自己的本地和 Fork topic branch，再开始下一关：

```bash
git switch main
git branch -d exercise/1-123
git push origin --delete exercise/1-123
```

## GitHub Desktop 对照

| 命令行操作 | GitHub Desktop |
| --- | --- |
| `git clone` | File → Clone repository |
| `git remote add upstream` | Desktop 没有完整界面支持，建议在 Repository → Open in Terminal 中执行一次 |
| `git switch -c ...` | Current Branch → New Branch，并选择机器人分支作为起点 |
| `git add` + `git commit` | 勾选文件、填写 Summary、点击 Commit |
| `git push` | Push origin |
| 创建 PR | Branch → Create Pull Request |

Exercise 4 的冲突处理仍建议打开终端完成，因为需要明确理解 upstream、merge/rebase 和冲突标记。
