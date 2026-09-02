# 第 1 课：第一次 Pull Request

本关目标是完整走一次最小贡献闭环。你会同时看到不少新名词，但只需要记住一条主线：在独立分支修改一个文件，把 commit push 到自己的 Fork，再向上游发起 PR。

预计 25 分钟。开始前应完成[准备篇](../getting-started.md)。

## 先理解：为什么需要 Fork 和 branch

你没有上游仓库的直接写权限，所以先在 GitHub 创建自己的 Fork。Fork 解决“我把 commit push 到哪里”；topic branch 解决“这次改动和其他任务怎样隔离”；PR 解决“怎样请上游讨论并接收这次改动”。

本关中的四个位置是：

```text
上游临时 base：机器人准备的起点和接收目标
本地 topic branch：你正在工作的分支
Fork topic branch：git push 上传后的副本
Pull Request：比较 Fork head 和上游 base 的协作页面
```

预测一下：直接在 Fork 的 `main` 修改虽然也能 push，为什么不适合协作？因为多个任务会混在同一分支，PR 很难只展示一个目的。

## 1. 创建练习会话

打开 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose)，选择 **Exercise 1 · 第一次 Pull Request** 并提交。

机器人回复后，找到三项动态信息：Issue 编号、`practice/ex1/...` base 分支和 `exercise/1-...` topic branch。不要使用教程截图中的示例编号。

## 2. 从正确起点创建本地分支

在 clone 目录中复制机器人给出的命令。形式会像这样：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git switch -c exercise/1-ISSUE_NUMBER upstream/YOUR_PRACTICE_BASE
git status
```

`fetch` 只获取上游数据，不会改动当前文件；`switch -c` 才会创建并切换分支。`status` 应显示当前位于 `exercise/1-...`，工作区干净。

此时出现两个新文件：

- `.practice/session.json`：机器人使用的会话清单，不要修改；
- `.practice/workspace.md`：本关唯一要修改的文件。

## 3. 修改、检查、暂存和提交

打开 `.practice/workspace.md`，把两处 `TODO` 换成你的 GitHub 用户名和感兴趣的开源方向。保存后依次观察：

```bash
git status
git diff
git add .practice/workspace.md
git diff --staged
git commit -m "docs: complete exercise 1"
git log -1 --oneline
```

在 `git add` 前，变化显示为未暂存；之后 `git diff` 变空，而 `git diff --staged` 显示准备提交的内容。commit 后 `git status` 应再次干净。

如果 `git diff --staged` 出现其他文件，先运行 `git restore --staged OTHER_FILE`，不要把无关内容一起提交。

## 4. push 到自己的 Fork

```bash
git push -u origin exercise/1-ISSUE_NUMBER
```

`origin` 必须是你的 Fork。`-u` 建立跟踪关系，以后在这个分支只需 `git push`。第一次 push 可能打开浏览器完成认证；GitHub 不接受把账号密码直接当 Git 密码。

## 5. 创建并检查 PR

优先点击机器人 Issue 评论里的 **创建 Pull Request** 链接。提交前逐项确认：

- base repository 是 `lin594/code-contributing-practice`；
- base 是机器人给出的 `practice/ex1/...`；
- head repository 是你的 Fork；
- compare 是 `exercise/1-...`；
- **Files changed** 只有 `.practice/workspace.md`。

PR 正文模板会带 `Closes #Issue编号`。本关写错只产生 Warning，第 3 关会正式学习它。点击创建后等待 `Practice / Grade`；不要关闭 PR 或为了红灯再建一个 PR。

## 通过后你应能解释

- Fork 和 clone 分别发生在 GitHub 还是本地？
- `git commit` 与 `git push` 的边界是什么？
- PR 的 base 和 head 分别指向哪里？

能用自己的话回答后，进入[第 2 课：暂存区与原子提交](02-atomic-commits.md)。

## 本关常见卡点

- `remote upstream already exists`：不需要重复添加，运行 `git remote -v`。
- `src refspec ... does not match`：检查是否已经 commit，以及分支名是否与 `git branch --show-current` 一致。
- PR base 误选 `main`：在 PR 页面编辑 base，换成机器人分支。

完整恢复方法见[故障排查](../troubleshooting.md)。
