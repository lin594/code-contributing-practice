# 故障排查

先保存终端原始错误，再运行：

```bash
git status
git branch --show-current
git remote -v
```

不要一次尝试多种修复。每做一步就重新看 `status`，确认状态是否按预期改变。

## `not a git repository`

终端当前不在 clone 的仓库目录中。用 `pwd` 和 `ls` 找到位置，再进入：

```bash
cd PATH/TO/code-contributing-practice
git status
```

不要在任意目录运行初始化命令来掩盖问题。

## `remote upstream already exists`

说明已经配置过，不需要重复添加：

```bash
git remote -v
```

若 `upstream` URL 不是课程原仓库，再明确修改：

```bash
git remote set-url upstream https://github.com/lin594/code-contributing-practice.git
git remote -v
```

## push 时认证失败

先确认 `origin` 指向自己的 Fork：

```bash
git remote get-url origin
```

HTTPS push 可能打开浏览器或凭据管理器。GitHub 不接受账号密码作为 Git 密码；按 [GitHub 官方认证说明](https://docs.github.com/en/get-started/git-basics/set-up-git#authenticating-with-github-from-git)选择 HTTPS、GitHub CLI 或 SSH。不要把 token、密码或私钥粘贴到 Issue、PR、截图或聊天中。

## 找不到机器人提供的分支

复制 Issue 评论里的完整分支名：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git branch -r --list "upstream/practice/*"
```

仍找不到时检查：

- `upstream` 是否指向课程原仓库；
- Issue 是否显示 `session:active`；
- 会话是否已连续 14 天无活动而过期。

过期后应新建当前关 Exercise Issue，不要自行猜一个 base。

## `a branch named ... already exists`

先查看现有分支：

```bash
git branch --list
git switch EXISTING_BRANCH
git status
```

如果它属于当前 Issue，就继续使用。若属于旧会话，保留旧分支并给新分支换一个清楚名称；PR head 不要求逐字等于机器人建议，只要符合 `exercise/` 等允许前缀且不是 `main`。

如果已经用不合格名称创建了 PR，GitHub 不允许把 open PR 换成另一个 head branch，重命名 head 还会关闭 PR。先关闭错误 PR，从同一机器人 base 建立正确分支，再创建引用同一 Exercise Issue 的 PR。这是“继续更新原 PR”规则的少数例外。

## push 报 `src refspec ... does not match`

常见原因是分支名写错或还没有 commit：

```bash
git branch --show-current
git log -1 --oneline
git status
```

使用第一条输出的准确分支名；如果没有本关 commit，先完成 add/commit。

## PR 的 base 选成了 `main`

不要关闭 PR。在 PR 标题旁点击 **Edit**，把 base 改成 Issue 评论里的 `practice/ex...`。如果无法选择，先确认临时分支仍存在且会话未过期。

## 修改了不允许的文件

先区分未提交与已提交：

```bash
git status
git diff
git diff --staged
```

未暂存的误改可按精确路径恢复：

```bash
git restore README.md
```

误加入暂存区但想保留本地内容：

```bash
git restore --staged README.md
```

如果已经 commit，最适合初学者的恢复方式通常是从机器人 base 建立一个新 topic branch，只重新完成 workspace；保留旧分支以便对照。

## commit 数量不正确

查看本 PR 相对 base 的历史：

```bash
git log --oneline upstream/YOUR_PRACTICE_BASE..HEAD
```

Exercise 1 要求一条，Exercise 2 要求两条。最安全的重做方式：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git switch -c exercise/2-ISSUE-retry upstream/YOUR_PRACTICE_BASE
```

然后按第 2 课顺序重新编辑和提交，push 新分支。GitHub 不能更换 open PR 的 head branch，因此关闭旧 PR，再用新分支创建引用同一 Issue 的 PR。熟悉历史后可使用 `git rebase -i`，但不要在不理解 `pick`、`reword`、`squash` 时照抄。

## Draft 已经直接变成普通 PR

在 PR 页面找到 **Convert to draft**，让机器人先观察 Draft。看到自动反馈更新后，完成作者自查，再点击 **Ready for review**。保留同一 PR。

## 新 commit 没有更新原 PR

确认当前分支与 PR head 名称一致：

```bash
git branch --show-current
git log -1 --oneline
git status
git push
```

只修改本地文件、push 到另一个分支或只编辑 PR 正文，都不会改变当前 PR 的 head SHA。

## Review 回复后检查没有重跑

确认评论写在练习 PR 的 Conversation 中，而不是 Exercise Issue。新评论会触发复查；如果刚提交，等待片刻并刷新 **Checks**。不要用空 commit 催促。

## 同步后仍提示缺少上游 commit

只 `fetch` 不够。先看图形历史：

```bash
git log --oneline --graph --decorate -8
```

然后把机器人 base 整合进当前分支：

```bash
git merge upstream/YOUR_PRACTICE_BASE
# 或在自己的 topic branch 使用 rebase
git rebase upstream/YOUR_PRACTICE_BASE
```

完成后还要 push。不要只手工输入机器人更新的文字；检查会验证可信 commit 的祖先关系。

## 出现 merge conflict

```bash
git status
```

编辑 `both modified` 文件，删除 `<<<<<<<`、`=======`、`>>>>>>>` 并写出符合双方意图的最终内容，然后：

```bash
git add .practice/workspace.md
git diff --staged
git commit          # merge 流程
# 或 git rebase --continue
git push
```

想回到整合前：

```bash
git merge --abort
# 或 git rebase --abort
```

## 自动检查一直没有重新运行

能触发复查的动作包括：向同一 PR head push、新建/编辑本人的 PR 评论、编辑 PR 标题或正文、Draft 转 Ready。先确认动作发生在正确 PR。GitHub Actions 服务异常时可查看仓库 **Actions** 页面，不要重复创建 Issue。

## 自动合并被暂停

存在 `automerge:disabled` 标签或维护者提交了 Changes requested 时，机器人必须停止。处理人工反馈后请维护者重新确认；学员不能通过修改 workspace 绕过。

## 想完全重新开始本关

不要删除 Fork。保留当前分支和 PR 作为现场，在同一 Exercise Issue 下从机器人 base 创建新 topic branch。只有无法把 PR 指向新 head 时才关闭旧 PR，并在新 PR 中继续引用同一 Issue。若会话已经过期，才创建新的 Exercise Issue。
