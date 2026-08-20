# Git 速查表

## 查看状态和历史

```bash
git status
git diff
git diff --staged
git log --oneline --graph --decorate -10
git branch --show-current
git remote -v
```

## 分支

```bash
git fetch upstream BRANCH_NAME
git switch -c NEW_BRANCH upstream/BRANCH_NAME
git switch EXISTING_BRANCH
git branch -d FINISHED_BRANCH
```

## 提交

```bash
git add PATH
git commit -m "docs: explain the change"
git commit --amend
git log --oneline BASE..HEAD
```

## 推送

```bash
git push -u origin BRANCH_NAME
git push
git push --force-with-lease  # 仅用于自己已重写历史的 topic branch
git push origin --delete FINISHED_BRANCH
```

## 同步与冲突

```bash
git fetch upstream BASE_BRANCH
git merge upstream/BASE_BRANCH
git rebase upstream/BASE_BRANCH
git merge --abort
git rebase --abort
```

## 恢复误操作

```bash
git restore PATH                 # 丢弃未暂存的指定文件修改
git restore --staged PATH        # 取消暂存但保留文件修改
git reflog                       # 查找近期 HEAD 位置
```

执行恢复或历史重写前先运行 `git status` 和 `git log --oneline --graph`。不要复制自己不理解的 `reset --hard` 或普通 `--force` 命令。
