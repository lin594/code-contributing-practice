# 维护者手册

## 首次上线

1. 合并本次改造后，在 Actions 中运行 **Practice / Administration**，选择 `bootstrap-labels`。
2. 在仓库 Settings → Actions → General 中允许工作流获得读写 `GITHUB_TOKEN`；每个 workflow 仍使用显式最小权限。
3. 只启用 squash merge，关闭 merge commit 和 rebase merge。
4. 为 `main` 建立 ruleset：禁止 force push 和删除，要求 Pull Request、至少一次批准，并要求 `CI / Tests`、`CI / Workflow lint`、`CI / Workflow security`。
5. 确认 Issues 的自动关闭设置不影响普通维护 PR；练习 Issue 由机器人显式关闭。
6. 使用测试账号从 Fork 完整走完四关，再公开 Issue Forms。

旧会话迁移必须显式运行 **Practice / Administration**：选择 `close-legacy-sessions`，并在 confirmation 输入 `CLOSE_LEGACY`。它只处理带旧 `exercise1`/`exercise2` 标签的 open Issue 及其指向 `main` 的关联 PR。

## 权限与安全边界

`Practice / Grade` 使用 `pull_request_target`，因为需要给 Fork PR 留言、更新标签和合并临时 base。修改它时必须保证：

- checkout 始终来自默认分支，且 `persist-credentials: false`；
- 不 fetch、checkout、安装或执行 PR head；
- Fork 的 `workspace.md`、标题、正文和分支名只通过 GitHub API 读取为数据；
- 自动合并 job 重新运行完整判题，并用已判定的 exact head SHA 调用 merge API；
- 练习只能修改 `.practice/workspace.md`，任何工作流、脚本或 manifest 变更都会阻断；
- `automerge:disabled` 和人工 Changes requested 始终优先于机器人结论。

CI 中的 `check-source.mjs` 会阻止未固定 SHA 的 Actions 和常见 privileged-checkout 模式。actionlint 下载固定版本，并使用官方 checksums 文件校验归档。

## 日常运维

- 清理任务每天运行；10 天无学员活动时提醒，14 天时关闭会话并删除 base。
- 清理失败时可重新运行 **Practice / Cleanup**；所有关闭、标签和删分支操作按幂等方式处理。
- 学员遇到误判时先加 `automerge:disabled`，保留 PR 和分支现场，再检查反馈对应的 head SHA。
- 修改纯判题规则必须同时更新 `tests/practice/`；修改操作步骤必须同步课程和排错文档。
- Dependabot 每周检查 GitHub Actions。升级 Action 时仍必须保留完整 commit SHA，并更新旁边的版本注释。

## 验收清单

- Exercise 1：一条格式不规范的 commit 只产生 Warning，仍可通过。
- Exercise 2：一条或三条 commit、merge commit、额外文件均会阻断。
- Exercise 3：第一次必定请求修改；同一 PR push 新 head 后通过。
- Exercise 4：PR 打开后确实变为冲突；merge 和 rebase 两种结果均可通过。
- 通过后 PR 为 merged、Issue 为 completed/closed、临时 base 不存在。
- 完成任意练习前后，`main` tree 不发生变化。
- 普通 `main` 维护 PR 只收到建议，永不触发自动合并。
