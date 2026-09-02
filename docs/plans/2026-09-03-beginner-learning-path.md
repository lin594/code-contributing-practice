# Beginner Git/GitHub Learning Path Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将四个跨度较大的自动练习升级为面向零基础大一新生的准备篇、八个递进关卡和毕业实战指南。

**Architecture:** 保留 Issue → 临时上游分支 → Fork PR → 自动反馈 → 自动清理的数据流，将会话升级到 schema v2。自动化以共享安全规则加关卡专属规则判定；Draft、Review 和上游更新通过反馈状态或可信会话清单记录，课程内容使用独立 lesson 文档承载。

**Tech Stack:** Markdown、GitHub Issue Forms、GitHub Actions、Node.js 22 ESM、`node:test`。

---

### Task 1: 固定课程契约和会话模型

**Files:**
- Modify: `scripts/practice/constants.mjs`
- Modify: `scripts/practice/session.mjs`
- Modify: `tests/practice/session.test.mjs`

**Steps:**
1. 先把测试扩展到 1–8 关，并断言非法的 0/9、schema v1 和错误分支都被拒绝。
2. 运行 `node --test tests/practice/session.test.mjs`，确认新断言先失败。
3. 增加统一关卡数量、标题、lesson 路径、label 和分支解析规则；新增八份 workspace 模板。
4. 重新运行测试，期望全部通过。

### Task 2: 实现八关判题和状态行为

**Files:**
- Modify: `scripts/practice/grade.mjs`
- Modify: `scripts/practice/lifecycle.mjs`
- Modify: `scripts/practice/workflow.mjs`
- Modify: `tests/practice/grade.test.mjs`
- Modify: `tests/practice/lifecycle.test.mjs`

**Steps:**
1. 为八关建立完整通过 fixture，并分别增加原子提交、PR 元数据、Draft、Review、同步、冲突和综合关卡的失败测试。
2. 运行相关测试，确认 5–8 关和新状态测试失败。
3. 将 closing reference、标题和分支命名从通用建议升级为“学习前建议、学习后必需”；保留身份/base/文件范围等共享硬门槛。
4. 实现第 4 关 Draft 观测、第 5/8 关 Review head 观测、第 6/7/8 关可信上游更新注入与祖先验证。
5. 更新完成消息、标签初始化和前置关卡检查到八关。
6. 运行 `node --test tests/practice/*.test.mjs`，期望全部通过。

### Task 3: 建立从零开始的教学正文

**Files:**
- Modify: `README.md`
- Modify: `docs/getting-started.md`
- Create: `docs/learning-path.md`
- Create: `docs/glossary.md`
- Create: `docs/lessons/01-first-pull-request.md`
- Create: `docs/lessons/02-atomic-commits.md`
- Create: `docs/lessons/03-clear-collaboration.md`
- Create: `docs/lessons/04-draft-pull-request.md`
- Create: `docs/lessons/05-review.md`
- Create: `docs/lessons/06-sync-upstream.md`
- Create: `docs/lessons/07-conflicts.md`
- Create: `docs/lessons/08-capstone.md`
- Modify: `docs/exercises.md`
- Modify: `docs/git-cheatsheet.md`
- Modify: `docs/troubleshooting.md`

**Steps:**
1. 把 README 改成单一入口：适合谁、完成后会什么、预计时间、从哪里开始、卡住去哪里。
2. 在准备篇解释 Git/GitHub、三区模型、remote、安装/配置/认证和命令输出自检。
3. 为每关按“目标、概念、预测、实操、自查、错误、复盘”写独立 lesson，并链接到准确 Issue Form。
4. 把 exercises 保持为验收规则索引，把 cheatsheet 和 troubleshooting 按学习者当前状态补齐。
5. 人工检查所有相对链接和命令占位符。

### Task 4: 更新 GitHub 入口和维护流程

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/exercise-1.yml`
- Modify: `.github/ISSUE_TEMPLATE/exercise-2.yml`
- Modify: `.github/ISSUE_TEMPLATE/exercise-3.yml`
- Modify: `.github/ISSUE_TEMPLATE/exercise-4.yml`
- Create: `.github/ISSUE_TEMPLATE/exercise-5.yml`
- Create: `.github/ISSUE_TEMPLATE/exercise-6.yml`
- Create: `.github/ISSUE_TEMPLATE/exercise-7.yml`
- Create: `.github/ISSUE_TEMPLATE/exercise-8.yml`
- Modify: `.github/PULL_REQUEST_TEMPLATE/exercise.md`
- Modify: `docs/maintainers.md`

**Steps:**
1. 让每个 Issue Form 只检查本关真正需要的准备条件，并链接对应 lesson。
2. 更新 PR 模板的关卡范围、base/head/文件范围和学习者自查。
3. 增加 schema v1 会话迁移说明和八关测试账号验收矩阵。
4. 运行 source check，确认高权限工作流仍只执行可信代码。

### Task 5: 完整验证与提交

**Files:**
- Modify as needed: all files above

**Steps:**
1. 运行 `npm ci --ignore-scripts`。
2. 运行 `npm run check`，期望单元测试和源代码安全检查全部通过。
3. 运行 `git diff --check`，期望无空白错误。
4. 用 `rg` 检查过时的“四关”、`exercise < 4`、`[1-4]` 和旧关卡语义。
5. 从 README 顺序读取准备篇、第一课、Issue Form、机器人回复和排错页，确认新生不需要猜下一步。
6. 查看 `git diff`，确保没有覆盖无关用户改动。
7. 创建清晰的 git commit。

