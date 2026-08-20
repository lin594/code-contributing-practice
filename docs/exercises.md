# 四关练习说明

所有关卡都只允许修改 `.practice/workspace.md`。`session.json`、工作流和仓库文档不属于练习产物，修改它们会被硬性检查阻止。

## Exercise 1：第一次贡献

目标是完整经历 Fork → branch → commit → push → Pull Request。

操作要求：

1. 把 `workspace.md` 中的 GitHub 用户名改成当前账号；
2. 填写自己希望参与的开源方向；
3. 本关最终只能有一条 commit；
4. PR 正文包含 `Closes #本关Issue编号`。

Commit message 和 PR 标题推荐使用 `docs: complete exercise 1`。其他写法可能产生 Warning，但不会单独阻止通过。

## Exercise 2：干净的提交历史

本关使用全新临时 base 和 topic branch，不依赖上一关遗留的文件。

必须按顺序完成两条提交：

1. 第一条填写“我学到的 Git 命令”；
2. 第二条填写“为什么要保持提交历史干净”。

最终 PR 必须恰好有两条 commit，且不能含 merge commit。如果不小心产生多余提交，可练习交互式 rebase：

```bash
git rebase -i HEAD~3
```

在真实使用前先阅读 `git rebase --help`。不确定时也可以删除当前 topic branch，从机器人 base 重新创建；不要删除 Fork 或练习 Issue。

## Exercise 3：响应 Code Review

第一次 push 并创建 PR 后，机器人一定会提出一次修改要求。此时红灯是课程的一部分，不代表操作失败。

在原分支中：

1. 把状态改为 `状态：已根据反馈修改`；
2. 删除剩余 `TODO`；
3. 新增 `## 修改说明` 并说明改了什么；
4. commit、push 到原分支；
5. 建议在 PR 评论中回复处理结果。

机器人会验证 head SHA 已变化，因此不能只编辑 PR 描述或重新运行检查。新建另一个 PR 也不会继承第一次 Review 状态。

## Exercise 4：解决上游冲突

创建 PR 前，把 `最终内容：待填写` 改为：

```text
最终内容：我的修改
```

PR 创建后，机器人会把上游 base 的同一行改成 `最终内容：上游更新`。GitHub 随后会显示冲突。

### 使用 merge（推荐第一次选择）

```bash
git fetch upstream YOUR_PRACTICE_BASE
git merge upstream/YOUR_PRACTICE_BASE
```

打开冲突文件，会看到三段标记。下面用说明文字代替真实的七个符号，避免仓库自检把教学示例误判为尚未解决的冲突：

```text
[当前分支开始：七个小于号 + HEAD]
最终内容：我的修改
[分隔线：七个等号]
最终内容：上游更新
[上游结束：七个大于号 + upstream/...]
```

删除冲突标记并同时保留双方内容：

```text
最终内容：上游更新 + 我的修改
```

然后执行：

```bash
git add .practice/workspace.md
git commit
git push
```

### 使用 rebase（可选）

```bash
git fetch upstream YOUR_PRACTICE_BASE
git rebase upstream/YOUR_PRACTICE_BASE
# 编辑并解决冲突
git add .practice/workspace.md
git rebase --continue
git push --force-with-lease
```

只在自己的练习 topic branch 使用 `--force-with-lease`，不要对共享分支使用强制 push。机器人接受 merge 和 rebase 两种结果，并验证注入的上游 commit 已进入分支历史。

## 完成课程以后

去真实开源仓库寻找适合新贡献者的 Issue。开始前阅读该项目的 README、CONTRIBUTING、测试说明和已有 PR；不同项目对分支、提交、测试和 Review 的要求可能不同，应以目标项目规则为准。
