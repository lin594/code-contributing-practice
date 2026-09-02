# 贡献指南

本仓库同时接受两类 Pull Request：用于学习的练习 PR，以及改进课程和自动化的维护 PR。两者的 base、权限和合并方式不同，请先确认自己属于哪一种。

## 完成练习

练习 PR 必须从 Exercise Issue Form 开始。机器人会创建专属 `practice/ex...` base 分支并给出命令；不要把练习直接提交到 `main`。

练习的硬性规则由每关目标决定，例如提交数量、是否复用原 PR、修改范围和冲突是否解决。协作规范采用渐进式要求：第 1–2 关先作为 Warning，第 3 关学习后成为后续关卡的硬性规则。

- Commit message 推荐 `type: summary` 或 `type(scope): summary`；
- PR 标题使用简洁、动作明确的同类格式；
- 分支名使用 `exercise/<关卡>-<Issue 编号>` 等清楚前缀；
- PR 正文关联正确 Issue，并说明改动与验证方式；
- 第 5/8 关收到 Review 后，留言说明处理内容和验证结果。

常用提交类型包括 `docs`、`feat`、`fix`、`test`、`refactor`、`build`、`ci`、`chore` 和 `revert`。示例：

```text
docs: complete exercise 1
fix(ci): explain an invalid issue reference
```

Commit message 不符合推荐格式、使用 `WIP`/`fixup!`/`squash!` 时只产生 Warning。第 3 关起，模糊 PR 标题、无意义 branch 或缺少正确 `Closes #...` 会阻断，因为这些正是已经学习过的协作目标。

## 改进训练仓库

课程文档、判题器、模板和工作流的改进 PR 应以 `main` 为 base，并经过人工 Review。建议流程：

1. 使用 Improvement Issue Form 描述问题和期望行为；
2. 从最新 `upstream/main` 创建独立分支；
3. 修改判题规则时先补失败测试，再实现规则；
4. 更新会影响学员操作的相应文档；
5. 使用维护 PR 模板说明测试范围和安全影响。

本地检查：

```bash
npm ci --ignore-scripts
npm run check
git diff --check
```

CI 还会使用固定版本的 actionlint 检查工作流语法。修改高权限自动化时，必须保持以下安全边界：

- `pull_request_target` 只能 checkout 并执行默认分支中的可信代码；
- 不得 checkout、安装或执行 Fork 中的脚本、依赖和配置；
- PR 标题、正文、分支名和文件内容必须作为数据传递，不能插入 shell；
- 自动合并前必须重新验证当前 head SHA、会话、Review 和允许路径；
- 权限按 job 最小化，所有第三方 Actions 固定到完整 commit SHA。

## Review 与合并

- 练习 PR：硬性检查通过后由机器人 squash merge 到临时 base，并自动清理。
- 维护 PR：CI 通过且至少一名维护者批准后，人工 squash merge 到 `main`。
- `automerge:disabled` 是练习 PR 的人工停止开关；存在该标签或人工 Changes requested 时，机器人不得合并。
- 对现有行为有疑问时，优先保持改动小，并在 Issue 中确认方向。
