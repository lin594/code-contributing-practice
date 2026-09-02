# 维护者手册

## 首次部署或从四关版升级

1. 合并课程与自动化后，在 Actions 运行 **Practice / Administration**，选择 `bootstrap-labels`，创建/更新 `exercise:1`–`exercise:8` 和 session labels。
2. 如果仓库曾开放旧练习，再运行同一 workflow，选择 `close-legacy-sessions`，并在 confirmation 输入 `CLOSE_LEGACY`。
3. 在 Settings → Actions → General 中允许 workflow 获得读写 `GITHUB_TOKEN`；每个 workflow 仍按 job 声明显式权限。
4. 只启用 squash merge，关闭 merge commit 和 rebase merge。
5. 为 `main` 建立 ruleset：禁止 force push 和删除，要求 Pull Request、至少一次批准，并要求 `CI / Tests`、`CI / Workflow lint`、`CI / Workflow security`。
6. 使用独立测试账号按本页验收矩阵走完八关，再向学生发仓库链接。

迁移操作会处理两类 open 旧会话：早期 `exercise1`/`exercise2` Issue 及其指向 `main` 的 PR；四关版 `session:active` Issue 中 manifest schema 低于当前版本的临时分支及关联 PR。它会留言、关闭 PR/Issue，并删除旧临时 base，不删除学员 Fork 中的 commit。当前 schema 会话不会被选中。前置关卡还会检查 `practice-completion:v2` 评论，因此旧版 completed Issue 不会错误解锁新课程的后续关卡。

## 运行模型

1. 学员创建带 `exercise:N` 的 Issue Form。
2. Session workflow 检查 Exercise N−1 的 `session:completed` Issue，为学员创建独立 base、manifest 和 workspace。
3. 学员从该 base 建立 Fork topic branch，并向临时 base 提交 PR。
4. Grade workflow 对 PR 元数据和 Fork 文件做只读 API 检查；第 4 关记录 Draft，第 5/8 关记录 Review head，第 6/7/8 关按需修改可信 base。
5. 学员 push 或在 PR 留言时重新判定。通过后 merge job 重新读取 exact head、完整判定并 squash merge。
6. Finalize 删除临时 base、关闭 Issue 并标记 `session:completed`。

`issue_comment` 触发用于让第 5/8 关的作者回复可以直接复查；普通 Issue 评论和 closed PR 评论会被跳过。由仓库 `GITHUB_TOKEN` 产生的机器人评论不会递归触发新 workflow。

## 权限与安全边界

`Practice / Grade` 使用 `pull_request_target` 和 `issue_comment`，因为它需要给 Fork PR 留言、更新标签和合并临时 base。修改时必须保持：

- checkout 始终来自默认分支，且 `persist-credentials: false`；
- 不 fetch、checkout、安装或执行 PR head；
- Fork 的 workspace、标题、正文、评论和分支名只通过 GitHub API 读取为数据；
- 上游注入只允许本人、正确 base、正确 Issue 关联且 exercise 为 6/7/8 的会话；
- 自动合并 job 重新运行完整判题，并用已判定的 exact head SHA 调用 merge API；
- 练习只能修改 `.practice/workspace.md`，任何 workflow、脚本或 manifest 变更都会阻断；
- `automerge:disabled` 和人工 Changes requested 始终优先于机器人结论。

Administration 的 `contents: write` 只用于显式 dispatch 的标签初始化和旧临时分支清理。Cleanup 的关闭、标签和删分支操作应保持幂等。

CI 中的 `check-source.mjs` 会阻止未固定 SHA 的 Actions 和常见 privileged-checkout 模式。actionlint 下载固定版本，并使用官方 checksums 文件校验归档。

## 日常运维

- 清理任务每天运行；10 天无学员活动时提醒，14 天时关闭会话并删除 base。
- 清理失败可重新运行 **Practice / Cleanup**。
- 学员遇到疑似误判时，先加 `automerge:disabled`，保留 PR、Issue、base 和 head，再核对反馈中的 head SHA。
- 修改 workspace 模板必须同步 `grade.mjs` fixture、对应 lesson、Issue Form 和 `docs/exercises.md`。
- 修改关卡数量必须同步 constants、session、labels、Issue Forms、README、学习地图和迁移说明。
- 修改判题规则先增加失败测试；修改操作步骤同步排错页。
- Dependabot 升级 Action 时保留完整 commit SHA，并更新旁边的版本注释。

## 自动化验收矩阵

| 关卡 | 正向路径 | 必须验证的反向路径 |
| --- | --- | --- |
| 1 | 一条普通 commit 通过 | 缺 TODO、额外文件、main head 阻断；标题差只 Warning |
| 2 | 两条线性 commit 通过 | 一/三条、merge commit 阻断 |
| 3 | 清晰 branch/title/body/Closes 通过 | 任一协作信息缺失阻断 |
| 4 | Draft 首检失败，Ready 后通过 | 从未 Draft 的普通 PR 保持 pending |
| 5 | 原 PR 新 commit + 内容修改 + 作者评论通过 | 只改正文、只 push、只评论均不能单独通过 |
| 6 | merge 路线和 rebase 路线都通过 | 手抄公告但不含上游 SHA 阻断 |
| 7 | merge/rebase 冲突都可完成 | 丢掉任一方内容或缺上游 SHA 阻断 |
| 8 | 同步、Review 修改、回复、自测组合通过 | 四项分别缺失时都阻断 |

每条正向路径还要确认：PR 最终为 merged、Issue 为 completed/closed、临时 base 不存在、Fork/local branch 未被机器人删除、`main` tree 没有学员产物。

## 发布前人工走查

- 从 README 出发，不借助维护者知识完成准备篇和第 1 课；动态值均来自机器人评论。
- 检查八个 Issue Form 在 New issue 页面按顺序显示，链接指向正确 lesson。
- 在第 5 关先 push 后评论，确认评论事件复查并自动合并。
- 第 6/7 关分别使用 merge 与 rebase 测试，覆盖 `--force-with-lease` 路径。
- 评论普通 Issue、closed PR，确认不会运行有效判题或改写反馈。
- 创建普通 `main` 维护 PR，确认只收到建议、永不触发练习自动合并。
