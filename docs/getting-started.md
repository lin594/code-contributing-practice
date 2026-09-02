# 准备篇：从零建立 Git/GitHub 环境

本篇完成后，你的电脑能够连接 GitHub，你也能看懂后续教程里的核心词。先完成本篇，再创建 Exercise 1。遇到问题只修当前自检项，不要一次复制很多“万能修复命令”。

## 1. 先分清 Git 和 GitHub

**Git** 是安装在电脑上的版本控制工具。它记录文件在不同时间点的变化，即使断网也可以查看历史和创建 commit。

**GitHub** 是托管 Git 仓库并支持协作的网站。Issue 用来讨论任务，Pull Request（PR）用来提出一组改动，Review 用来讨论这些改动是否应该合入。

可以把后续流程理解成：

```text
在电脑修改文件 → Git 保存版本 → push 到自己的 GitHub Fork
                                  ↓
上游仓库 ← Pull Request ← 邀请维护者评审
```

## 2. 准备账号、Git 和编辑器

你需要：

- 一个能正常登录的 GitHub 账号；
- Git 2.23 或更高版本；
- 任意纯文本编辑器，例如 VS Code；
- Terminal、PowerShell 或 Git Bash。

先运行：

```bash
git --version
```

看到类似 `git version 2.51.0` 就表示 Git 可用。若提示找不到命令，请按 [GitHub 官方安装说明](https://docs.github.com/en/get-started/git-basics/set-up-git)安装后重新打开终端。

本课程主路径使用命令行，因为错误信息更完整，也最容易迁移到服务器和开发工具。使用 GitHub Desktop 的同学仍需理解相同概念，常见按钮对照见文末。

## 3. 配置 commit 身份

这里的姓名会写进 commit，可以用真实姓名、英文名或常用昵称；它不必等于 GitHub 用户名。

```bash
git config --global user.name "YOUR_NAME"
git config --global user.email "YOUR_EMAIL"
git config --global init.defaultBranch main
```

`YOUR_EMAIL` 建议使用 GitHub 验证过的邮箱，或 GitHub 提供的 `noreply` 邮箱。检查结果：

```bash
git config --global user.name
git config --global user.email
```

预期分别输出你刚才设置的姓名和邮箱。不要把引号内的占位符原样复制。

## 4. 认识终端中的位置

后续只需要三个导航命令：

```bash
pwd       # 当前在哪个目录；PowerShell 可用 pwd
ls        # 当前目录有哪些文件；PowerShell 也可用 ls
cd PATH   # 进入 PATH 指定的目录
```

Git 命令作用于“当前目录所属的仓库”。如果出现 `not a git repository`，通常不是 Git 坏了，而是终端不在 clone 下来的项目目录中。

## 5. 建立最重要的三区模型

一次 commit 前，文件会经过三个区域：

```text
工作区（正在编辑） -- git add --> 暂存区（选中下次提交） -- git commit --> 本地历史
```

- `git status`：告诉你每个文件在哪个区域，是遇到问题时的第一条命令。
- `git diff`：查看还没加入暂存区的变化。
- `git diff --staged`：查看下一条 commit 准备保存的变化。
- `git add PATH`：把指定文件的当前变化放进暂存区。
- `git commit`：只保存暂存区，不会自动上传到 GitHub。
- `git push`：把本地 commit 上传到某个远端分支。

先预测：只修改文件但没有 `git add` 时，`git commit` 会不会保存它？答案是不会，因为 commit 只读取暂存区。

## 6. Fork、clone 和两个 remote

在本仓库页面点击 **Fork** → **Create fork**。Fork 是你账号下的协作副本，你可以向它 push，而不会直接改动教学仓库。

然后把 `YOUR_USERNAME` 换成自己的 GitHub 用户名：

```bash
git clone https://github.com/YOUR_USERNAME/code-contributing-practice.git
cd code-contributing-practice
git remote add upstream https://github.com/lin594/code-contributing-practice.git
git remote -v
```

最后一条命令应显示：

```text
origin    https://github.com/YOUR_USERNAME/code-contributing-practice.git
upstream  https://github.com/lin594/code-contributing-practice.git
```

记忆方式：

- `origin` 是你自己的 Fork，你通常向这里 push；
- `upstream` 是课程原仓库，你从这里 fetch 课程和专属训练分支。

如果 `remote upstream already exists`，不要重复添加，直接用 `git remote -v` 检查；URL 不对时查[故障排查](troubleshooting.md)。

## 7. 认证自检

公开仓库的 clone/fetch 不需要写权限，但第一次 push 时 GitHub 需要确认你的身份。HTTPS 通常会打开浏览器或系统凭据管理器。GitHub 不接受把账号密码直接当作 Git 密码；不要把访问令牌粘贴到 Issue、PR 或发给别人。

课程第一关的第一次 push 就是认证实测。如果认证失败，保留终端原始错误，查[认证失败](troubleshooting.md#push-时认证失败)，不要反复修改仓库内容。

## 8. 准备完成检查

在 clone 目录运行：

```bash
git status
git branch --show-current
git remote -v
```

你应看到：

- `git status` 没有 `not a git repository`；
- 当前分支通常是 `main`；
- `origin` 指向你的账号，`upstream` 指向 `lin594`。

全部满足后，进入[第 1 课：第一次 Pull Request](lessons/01-first-pull-request.md)。

## GitHub Desktop 对照

| 命令行概念 | GitHub Desktop |
| --- | --- |
| clone | File → Clone repository |
| 当前 branch | Current Branch |
| 工作区 diff | Changes 面板 |
| `git add` | 勾选准备提交的文件 |
| `git commit` | 填写 Summary 后点击 Commit |
| `git push` | Push origin |
| 创建 PR | Branch → Create Pull Request |

GitHub Desktop 对 `upstream` 和指定临时 base 的控制不如命令行直接。本课程仍建议在 Repository → Open in Terminal 中执行机器人给出的 `fetch` 和 `switch` 命令。
