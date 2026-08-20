# Git / GitHub 开源贡献练习场

这是一个面向 Git 和 GitHub 初学者的自动化练习仓库。你会使用真实的 Fork、Issue、branch、commit、Pull Request、Review 和冲突解决流程；机器人会在 PR 中指出具体问题、给出修复命令，并在通过后自动完成练习。

## 为什么练习不会弄乱 main

每个练习 Issue 都会获得一个专属的临时上游分支：

```text
practice/ex<关卡>/issue-<Issue 编号>-<GitHub 用户名>
```

练习 PR 合入这个临时分支，而不是 `main`。通过后机器人会 squash merge、关闭 Issue 并删除临时分支。因此主干只保存课程与自动化代码，普通 clone 不会下载其他人的练习产物。

## 四关学习路线

| 关卡 | 目标 | 必须完成 |
| --- | --- | --- |
| Exercise 1 | 第一次贡献 | Fork、topic branch、一条提交、关联 Issue、创建 PR |
| Exercise 2 | 干净历史 | 新分支、恰好两条提交、无线性历史污染 |
| Exercise 3 | 响应 Review | 在原 PR 中继续 commit 和 push，落实反馈 |
| Exercise 4 | 解决冲突 | fetch 上游，使用 merge 或 rebase 解决真实冲突 |

从仓库的 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 页面选择 Exercise 1 开始。后续关卡必须按顺序完成。

## 开始前

你需要：

- 一个 GitHub 账号；
- Git 2.23 或更高版本；
- 能够使用终端执行基础命令；
- 一个从本仓库创建的 Fork。

第一次使用请完整阅读[开始指南](docs/getting-started.md)。四关的任务和验收规则见[练习说明](docs/exercises.md)。

## 自动反馈怎么看

机器人会在 PR 中维护一条 `🤖 自动反馈` 评论：

- **必须修复**：练习目标没有完成，检查会显示红灯，并给出准确修改方法；
- **改进建议**：以 Warning 显示，不阻止练习完成；
- **下一步**：告诉你应该继续 push、解决冲突还是等待自动合并。

Commit message 推荐使用 `type: summary` 或 `type(scope): summary`，例如 `docs: add my practice notes`。PR 标题也推荐采用同样风格。格式不规范只会收到 Warning，不会单独导致练习失败。

## 需要帮助

- 常见报错和恢复命令：[故障排查](docs/troubleshooting.md)
- 常用 Git 命令：[Git 速查表](docs/git-cheatsheet.md)
- 改进课程或自动化：[贡献指南](CONTRIBUTING.md)

完成四关后，可以寻找带有 `good first issue`、`documentation` 或 `help wanted` 标签的真实开源仓库进行实战。先阅读目标仓库自己的贡献指南，并以它的规则为准。

## 给维护者

部署标签、仓库权限、分支保护、旧会话迁移和测试账号验收步骤见[维护者手册](docs/maintainers.md)。在完成初始化前，不要对外开放新的 Exercise Issue Forms。
