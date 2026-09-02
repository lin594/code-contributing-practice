# 第 6 课：同步上游更新

协作期间，base 可能在你的 PR 打开后继续变化。本关机器人会修改 workspace 的“课程公告”，而你修改较远的“个人笔记”；Git 可以自动整合，但你仍需主动 fetch 并把新 base 纳入 head 历史。

预计 20 分钟。必须先完成 Exercise 5。

## 先理解：fetch、merge、rebase 是三件事

- `git fetch upstream BRANCH`：下载上游新 commit，更新远端跟踪引用；不改变当前文件。
- `git merge upstream/BRANCH`：把上游历史和当前历史汇合，分叉时通常新增 merge commit。
- `git rebase upstream/BRANCH`：把自己的 commit 重新放到最新 base 之后，历史更直，但 commit SHA 会改变。

第一次练习推荐 merge，因为它不改写已 push 的 commit。rebase 路线用于理解后再选择，不是更“高级”就一定更好。

预测一下：只运行 `fetch` 后，workspace 会立即出现上游公告吗？不会；你还没有把远端跟踪分支整合进当前分支。

## 1. 先提交自己的变化

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 6 · 同步上游更新**。建立分支后，只把 `个人笔记：TODO` 换成自己的理解，不修改“课程公告”。

```bash
git add .practice/workspace.md
git commit -m "docs: add upstream sync notes"
git push -u origin exercise/6-ISSUE_NUMBER
```

创建 PR 后，机器人会把上游 base 中的公告改为 `课程公告：上游已更新`。第一次检查会提示 head 尚未包含该可信 commit。

## 2. 使用 merge 同步（推荐）

把机器人反馈中的完整 base 代入：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git status
git merge upstream/YOUR_PRACTICE_BASE
git log --oneline --graph --decorate -6
git push
```

这次两边修改的位置不同，merge 应自动完成。打开 workspace，确认既有“上游已更新”，也有你的个人笔记。

如果 Git 打开编辑器要求确认 merge commit message，保留默认说明并保存退出即可。若出现意外冲突，先 `git merge --abort`，确认自己是否误改了课程公告，再从本课开头检查。

## 可选：使用 rebase 同步

只在自己的练习 topic branch 使用：

```bash
git fetch upstream YOUR_PRACTICE_BASE
git rebase upstream/YOUR_PRACTICE_BASE
git log --oneline --graph --decorate -6
git push --force-with-lease
```

普通 `git push` 会拒绝重写远端历史，这是保护机制。`--force-with-lease` 会先确认远端仍是你预期的状态；不要对团队共享分支或 `main` 使用强制 push。

## 通过后你应能解释

- `fetch` 为什么通常是低风险的第一步？
- merge 和 rebase 的结果历史有什么不同？
- 为什么自动检查既看最终文字，也看上游 commit 是否在祖先历史中？

然后进入[第 7 课：解决合并冲突](07-conflicts.md)。
