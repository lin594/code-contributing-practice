# Git / GitHub 协作练习场

这是一门可以直接在 GitHub 上完成的零基础实践课。你不需要先会 Git，也不需要找到队友：仓库会为每位学习者创建隔离的练习分支，机器人会像助教一样检查 Pull Request、指出问题并告诉你下一步。

完成后，你能够：

- 解释 Git、GitHub、仓库、commit、branch、Fork 和 Pull Request 的关系；
- 从 Fork 开始完成一次规范的 GitHub 贡献；
- 把改动拆成清楚的提交，并写出别人能评审的 PR；
- 正确使用 Draft、处理 Review、同步上游并解决冲突；
- 从失败的 CI job/step 日志定位问题，在本地复现并验证最新 commit；
- 把同一套流程迁移到课程小组或真实开源项目。

## 第一次来，从这里开始

1. 打开[准备篇](docs/getting-started.md)，完成安装、配置和环境自检。
2. 查看[学习地图](docs/learning-path.md)，了解九关分别解决什么问题。
3. 阅读[第 1 课](docs/lessons/01-first-pull-request.md)，再按教程创建 Exercise 1 Issue。

不要直接在本仓库的 `main` 上提交练习，也不要只凭 Issue 标题猜命令。每次创建练习 Issue 后，机器人都会回复本次专属的 base 分支、准确命令和创建 PR 的链接。

## 九关路线

| 关卡 | 只新增一个主要能力 | 预计时间 |
| --- | --- | ---: |
| 1 · 第一次 Pull Request | 走通 Fork → commit → PR | 25 分钟 |
| 2 · 暂存区与原子提交 | 把两件事拆成两条 commit | 20 分钟 |
| 3 · 清晰地发起协作 | 写好分支名、Issue 关联和 PR 说明 | 15 分钟 |
| 4 · Draft Pull Request | 区分“分享进度”和“请求评审” | 15 分钟 |
| 5 · 响应 Code Review | 在原 PR 中修改、push 和回复 | 20 分钟 |
| 6 · 同步上游更新 | 在无冲突情况下 merge 或 rebase | 20 分钟 |
| 7 · 解决合并冲突 | 理解冲突并保留双方意图 | 25 分钟 |
| 8 · 协作综合练习 | 把说明、Review 和同步组合起来 | 30 分钟 |
| 9 · CI 失败诊断 | 从日志定位、本地复现并验证最新 commit | 20–25 分钟 |

准备篇通常需要 20–40 分钟。课程可以分多次完成；练习连续 10 天无活动会收到提醒，14 天无活动才会清理临时会话。

## 它怎样保护主干

每个 Exercise Issue 都会获得一个专属临时上游分支：

```text
practice/ex<关卡>/issue-<Issue 编号>-<GitHub 用户名>
```

你的练习 PR 合入这个临时分支，而不是 `main`。通过后机器人会 squash merge、关闭 Issue 并删除临时分支，所以主干只保存课程和自动化代码，不会积累所有人的练习文件。

自动反馈分成两类：

- **必须修复**：本关目标还没完成，检查是红灯；按“怎么做”修改原分支即可。
- **改进建议**：当前关不拦截，但会提前提示后续关卡或真实协作中的规范。

红灯不等于“操作失败”。第 4–9 关有意安排了 Draft、Review、上游变化或 CI 失败，第一次检查出现等待项正是练习的一部分。AI 的“应该没问题”不是通过证据；检查必须实际运行在 PR 当前 commit 上。

## 卡住时

- 根据当前现象查[故障排查](docs/troubleshooting.md)；
- 不记得命令时查[Git 速查表](docs/git-cheatsheet.md)；
- 遇到陌生词时查[术语表](docs/glossary.md)；
- 想确认验收规则时查[九关练习说明](docs/exercises.md)。

本课程不会要求你在 Issue、PR、终端截图或日志中粘贴密码、Personal Access Token、SSH 私钥。遇到此类提示，请停止并向老师或维护者确认。

## 给教师和维护者

部署标签、权限、分支保护、旧会话升级、安全边界和测试账号验收步骤见[维护者手册](docs/maintainers.md)。改进课程或自动化前请阅读[贡献指南](CONTRIBUTING.md)。
