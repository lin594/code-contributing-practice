# 第 9 课：从 CI 失败中定位问题

CI（持续集成）会在 PR 的 commit 上自动运行测试、格式检查或构建。AI 可以帮助解释日志和提出修改，但“看起来没问题”不是通过证据；证据必须来自针对当前 commit 实际运行的检查。

预计 20–25 分钟。必须先完成 Exercise 8。本关第一次红灯是故意安排的，请保留同一个 PR 完成失败、修复和验证。

## 怎样判断 PR 是否通过

先确认检查对应 PR 当前的 head SHA，再分别看：

1. 项目要求的 checks 是否全部成功；排队或运行中不算成功。
2. 是否仍有 Changes requested 或其他合并门禁。
3. PR 是否已经达到项目定义的完成状态。本课程最终以 **Merged** 为准。

绿色 check 只证明它检查过的那个 commit。之后再次 push 会产生新 SHA，旧绿灯不能替代新一轮结果。机器人评论是便于阅读的解释，check 状态和日志才是自动化执行证据。

## 1. 创建一个预期失败的 PR

从 [New issue](https://github.com/lin594/code-contributing-practice/issues/new/choose) 选择 **Exercise 9 · 从 CI 失败中定位问题**，建立机器人给出的分支。

第一次只把 workspace 中的：

```text
- 学习者：TODO
```

改成你的 GitHub 用户名。暂时保留失效链接和五处诊断 TODO，然后提交：

```bash
git add .practice/workspace.md
git diff --staged
git commit -m "docs: start CI diagnosis"
git push -u origin exercise/9-ISSUE_NUMBER
```

创建普通 PR。等待检查结束；`Practice / Grade` 和 `Practice / Grade · CI Lab` 出现红灯是预期结果，不要重新开 PR。

## 2. 从 check 进入失败日志

在 PR 的 **Conversation** 或 **Checks** 区域找到 `Practice / Grade · CI Lab`，点击 **Details**。进入 job 后展开 `Check local Markdown links`，按这个顺序阅读：

1. 找到第一条带文件和行号的错误；
2. 记录原链接和它解析出的目标路径；
3. 判断这是可以修改文件解决的测试失败，而不是只抄最后的 `exit code 1`；
4. 核对本次 run 显示的 commit 与 PR 当前 head 相同。

一个 job 可以包含许多 step。最末尾的非零退出状态只说明命令失败，真正能指导修改的通常是它前面最早出现的具体错误。

## 3. 在本地复现

回到同一分支运行日志给出的命令：

```bash
npm run check:ci-lab
```

本地应看到与 CI 相同的文件、行号、失效目标和原因。然后用仓库文件列表或 `ls` 找到实际的贡献指南，结合 workspace 所在的 `.practice` 目录修复相对路径。

填写 workspace 的五项诊断记录。每项都写具体观察：check 名称、step 名称、第一条可行动错误、命令及结果、最终修复；不要只写“报错了”或“已修复”。再次运行：

```bash
npm run check:ci-lab
git diff
```

本地检查应输出 `PASS`。确认 diff 只包含本关内容后提交并 push：

```bash
git add .practice/workspace.md
git diff --staged
git commit -m "docs: diagnose CI link failure"
git push
```

## 4. 验证最新 commit，而不是相信旧绿灯

等待 `Practice / Grade · CI Lab` 对新 commit 显示绿色。用下面命令取得当前短 SHA：

```bash
git rev-parse --short HEAD
```

确认它与 PR 最新 commit 一致，然后在 PR Conversation 留言，替换其中的 SHA：

```text
CI 已通过：abcdef1；失败 check：Practice / Grade；失败 step：Check local Markdown links；本地复现：npm run check:ci-lab
```

评论会触发 `Practice / Grade` 复查，不需要空 commit。只有失败 SHA、新 head、绿色 CI Lab、完整诊断和当前 SHA 评论同时成立，本关才会自动合并。

## 日志不一定代表代码有错

- **queued / in progress**：检查尚未给结论，先等待，不要改代码。
- **awaiting approval**：Fork 工作流需要维护者批准，联系维护者，不要用新 PR 绕过。
- **测试、lint 或构建失败**：读失败 job 和第一条可行动错误，先本地复现。
- **下载失败、服务异常或 runner 故障**：保留 run 链接和时间，确认是否为基础设施问题后再重跑。

AI 可以根据这些证据帮助你分析，但应该要求它引用具体日志、运行本地命令并报告退出结果。无论谁生成了修改，都要由当前 commit 的检查重新验证。

## 通过后你应能解释

- check、job、step 和日志分别是什么关系？
- 为什么旧 commit 的绿灯不能证明新 commit 没问题？
- 为什么第一条具体错误通常比最后的 `exit code 1` 更有用？
- AI 的判断与可复现的 CI 证据有什么区别？

完成后，你已经走通从提交 PR、读取自动反馈到独立验证 CI 的完整协作闭环。迁移到真实项目时，以对方的 CONTRIBUTING、required checks 和 Review 规则为准。
