# 故障排查

## `remote upstream already exists`

```bash
git remote -v
```

如果 URL 错误：

```bash
git remote set-url upstream https://github.com/lin594/code-contributing-practice.git
```

## 找不到机器人提供的分支

确认复制了完整分支名：

```bash
git fetch upstream
git branch -r --list "upstream/practice/*"
```

连续 14 天无活动的分支会被清理。已过期时请新建练习 Issue。

## PR 的 base 选成了 main

不要关闭 PR。在 PR 标题旁点击 **Edit**，把 base 改成 Issue 评论中的 `practice/ex...` 分支。如果无法选择，先确认临时分支仍存在。

## 修改了不允许的文件

先查看变更：

```bash
git status
git diff
```

恢复误改文件时，明确写出文件路径：

```bash
git restore README.md
```

不要使用会丢弃整个工作区的命令。如果文件已经 commit，可从专属 base 重新建立 topic branch，或在了解影响后使用交互式 rebase。

## Commit 数量不正确

查看本 PR 相对 base 的提交：

```bash
git log --oneline upstream/YOUR_PRACTICE_BASE..HEAD
```

Exercise 1 要求一条，Exercise 2 要求两条。需要修改最近一次 message：

```bash
git commit --amend -m "docs: complete exercise 1"
git push --force-with-lease
```

格式本身只影响 Warning；不要仅为了消除 Warning 在不理解历史重写时强制 push。

## 出现 merge conflict

```bash
git status
```

编辑 `both modified` 文件，删除 `<<<<<<<`、`=======`、`>>>>>>>`，决定最终内容后：

```bash
git add .practice/workspace.md
git commit          # merge 流程
# 或 git rebase --continue
git push
```

想放弃当前 merge/rebase：

```bash
git merge --abort
# 或 git rebase --abort
```

## 检查一直没有重新运行

确认新 commit 已 push 到 PR 的同一 head branch：

```bash
git status
git branch --show-current
git log -1 --oneline
git push
```

只修改本地文件、只修改 PR 正文或 push 到另一个分支，都不会满足需要新 head SHA 的练习。

## 自动合并被暂停

如果存在 `automerge:disabled` 标签或维护者提交了 Changes requested，机器人会停止合并。处理人工反馈后请维护者重新确认；不要试图通过修改练习文件绕过。
