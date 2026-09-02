# 学习地图

这门课不是命令词典，而是一条逐渐增加协作复杂度的路线。每关只把一个主要能力从“见过”变成“做过”，后续关卡会继续使用前面学过的动作。

## 开始前

- [ ] 我完成了[准备篇](getting-started.md)的三个自检命令。
- [ ] 我知道 `origin` 是自己的 Fork，`upstream` 是课程原仓库。
- [ ] 我知道先运行 `git status`，再判断下一步。
- [ ] 我愿意逐关完成，不同时创建多个练习会话。

## 路线和依赖

```text
准备篇
  ↓
1 第一次 PR → 2 原子提交 → 3 清晰协作 → 4 Draft
                                      ↓
8 综合协作 ← 7 解决冲突 ← 6 同步上游 ← 5 Review
```

| 关卡与教程 | 开始时已经会 | 本关新增能力 | 通过证据 |
| --- | --- | --- | --- |
| [1 第一次 PR](lessons/01-first-pull-request.md) | 环境与 remote | 完整贡献闭环 | 一条 commit 的 PR |
| [2 原子提交](lessons/02-atomic-commits.md) | 创建分支和 PR | 有选择地 stage | 两条线性 commit |
| [3 清晰协作](lessons/03-clear-collaboration.md) | 提交变化 | 解释变化 | branch、Issue、标题、正文清楚 |
| [4 Draft](lessons/04-draft-pull-request.md) | 写清 PR | 管理评审时机 | 机器人见过 Draft，最终 Ready |
| [5 Review](lessons/05-review.md) | 请求评审 | 在原 PR 迭代 | head 改变、要求落实、评论回复 |
| [6 同步上游](lessons/06-sync-upstream.md) | 更新自己的分支 | 整合无冲突更新 | head 包含可信上游 commit |
| [7 冲突](lessons/07-conflicts.md) | fetch/merge | 处理同一行竞争 | 历史与最终内容都正确 |
| [8 综合协作](lessons/08-capstone.md) | 前七关 | 组合运用 | 同步、Review、回复、自测全部完成 |

## 每关怎样学习

1. **先读概念**：能够用自己的话解释本关为什么存在。
2. **先预测再执行**：命令前先想 `status` 或历史会怎样变化。
3. **只复制机器人的动态值**：分支名和 Issue 编号每次不同。
4. **读自动反馈**：先处理“必须修复”，再理解 Warning。
5. **完成一句复盘**：回答教程末尾的问题，不要求背诵命令。

建议一次只学一到两关。快速完成并不重要；能够根据 `status`、diff 和 PR 页面判断当前状态，才是真正掌握。

## 机器人会做什么，不会做什么

机器人会创建隔离分支、检查可观察结果、模拟 Review 或上游修改，并在通过后清理。它不会读取你的密码，不会执行 Fork 中的代码，也无法证明你是否理解了某条命令。因此每课的“预测”和“复盘”需要你自己诚实完成。

如果自动检查结果和你看到的 Git 历史不一致，先保留现场并查[故障排查](troubleshooting.md)，不要为了绿灯盲目重写历史。

## 毕业后的迁移

完成第 8 关后，找一个课程小组仓库或带 `good first issue`、`documentation`、`help wanted` 标签的开源仓库。先读对方的 README、CONTRIBUTING 和测试说明，再使用它规定的分支、commit、PR 和 Review 流程。本课程的规则是练习脚手架，不会覆盖目标项目自己的约定。
