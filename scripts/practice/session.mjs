import {
  EXERCISE_COUNT,
  EXERCISE_LABELS,
  EXERCISE_LESSONS,
  EXERCISE_TITLES,
  SCHEMA_VERSION,
  SESSION_BRANCH,
  SESSION_FILE,
  WORKSPACE_FILE,
} from "./constants.mjs";

const UPSTREAM_MUTATIONS = new Map([
  [6, {
    before: "课程公告：等待同步",
    after: "课程公告：上游已更新",
    message: "chore(practice): publish upstream course update",
  }],
  [7, {
    before: "最终内容：待填写",
    after: "最终内容：上游更新",
    message: "chore(practice): inject upstream conflict",
  }],
  [8, {
    before: "协作约定：等待维护者补充",
    after: "协作约定：提交前先同步上游并回应 Review",
    message: "chore(practice): add maintainer collaboration note",
  }],
]);

export function upstreamMutation(exercise) {
  return UPSTREAM_MUTATIONS.get(exercise) ?? null;
}

export function branchNameFor({ exercise, issueNumber, actor }) {
  if (!Number.isInteger(exercise) || exercise < 1 || exercise > EXERCISE_COUNT) {
    throw new Error(`exercise must be an integer from 1 to ${EXERCISE_COUNT}`);
  }
  if (!Number.isInteger(issueNumber) || issueNumber < 1) {
    throw new Error("issueNumber must be a positive integer");
  }
  if (!/^[A-Za-z0-9-]{1,39}$/.test(actor)) {
    throw new Error("actor is not a valid GitHub login");
  }
  return `practice/ex${exercise}/issue-${issueNumber}-${actor}`;
}

export function parseSessionBranch(branch) {
  const match = SESSION_BRANCH.exec(branch ?? "");
  if (!match) return null;
  return {
    exercise: Number(match[1]),
    issueNumber: Number(match[2]),
    actor: match[3],
  };
}

export function createManifest({ exercise, issueNumber, actor, createdAt = new Date().toISOString() }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exercise,
    issueNumber,
    actor,
    baseBranch: branchNameFor({ exercise, issueNumber, actor }),
    state: "active",
    createdAt,
  };
}

export function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== SCHEMA_VERSION) return false;
  try {
    return (
      manifest.baseBranch === branchNameFor(manifest) &&
      ["active", "review-requested", "upstream-injected", "completed"].includes(manifest.state)
    );
  } catch {
    return false;
  }
}

export function workspaceTemplate(exercise) {
  const templates = {
    1: `# 我的第一次开源贡献

- GitHub 用户名：TODO
- 我希望参与的开源方向：TODO

请填写上面的用户名和开源方向。
`,
    2: `# 干净的提交历史

## 我学到的 Git 命令

TODO：请在第一个 commit 中填写。

## 为什么要保持提交历史干净

TODO：请在第二个 commit 中填写。
`,
    3: `# 清晰地发起协作

## 变更目的

TODO：用一两句话说明为什么值得做这次修改。

## 验证方式

TODO：说明评审者如何确认你的修改正确。
`,
    4: `# Draft Pull Request

状态：可以评审

## 完成标准

TODO：写出你认为评审者判断本次修改完成所需的一条标准。

第一次创建 PR 时请选择 Draft。检查运行后，再点击 Ready for review。
`,
    5: `# 响应 Code Review

状态：初稿

## 本次修改

TODO：先写下你的初稿并创建 PR。机器人会在 PR 中提出修改要求。
`,
    6: `# 同步上游更新

## 课程公告

课程公告：等待同步

这里保留足够的上下文间隔，让上游公告和你的笔记可以自动合并。

请先阅读本关教程，再完成下面的个人笔记。

## 我的同步笔记

个人笔记：TODO
`,
    7: `# 解决上游冲突

## 最终决定

最终内容：待填写

创建 PR 前，请把“待填写”改成“我的修改”。机器人随后会更新上游的同一行。
`,
    8: `# 协作综合练习

状态：初稿

## 变更目的

TODO：说明这次改动为谁解决什么问题。

## 协作约定

协作约定：等待维护者补充

这部分模拟协作期间由上游维护者补充的项目约定。

同步时请观察 Git 如何把它与较远位置的个人修改自动整合。

以上内容由维护者在你创建 PR 后更新。请同步上游，不要手工猜测新内容。

## 自测结果

TODO：写出你检查过的内容。
`,
    9: `# 从 CI 失败中定位问题

- 学习者：TODO
- 项目协作规则：[贡献指南](../docs/contributing.md)

创建 PR 前，只把上面的“学习者”改成你的 GitHub 用户名。请暂时保留失效链接和下面的 TODO，让 CI 先记录一次真实失败。

## 失败的 check

TODO：从 PR 的 Checks 区域记录 check 名称。

## 失败的 step

TODO：从 Details 日志记录最先给出可行动信息的 step。

## 第一条可行动错误

TODO：记录文件、行号和错误原因，不要只写 exit code 1。

## 本地复现

TODO：记录命令和本地失败结果。

## 修复内容

TODO：根据日志修复链接，并说明修改了什么。
`,
  };
  if (!templates[exercise]) throw new Error("unknown exercise");
  return templates[exercise];
}

export function sessionFiles(manifest) {
  return {
    [SESSION_FILE]: `${JSON.stringify(manifest, null, 2)}\n`,
    [WORKSPACE_FILE]: workspaceTemplate(manifest.exercise),
  };
}

export function issueInstructions({ manifest, repositoryUrl }) {
  const branch = manifest.baseBranch;
  const head = `exercise/${manifest.exercise}-${manifest.issueNumber}`;
  const title = EXERCISE_TITLES.get(manifest.exercise);
  const lesson = EXERCISE_LESSONS.get(manifest.exercise);
  const compareUrl = `${repositoryUrl}/compare/${encodeURIComponent(branch)}...${encodeURIComponent(`${manifest.actor}:${head}`)}?expand=1&template=exercise.md`;
  const editingInstructions = manifest.exercise === 9
    ? `先只把 \`${WORKSPACE_FILE}\` 中的“学习者”改成你的 GitHub 用户名，保留失效链接和诊断 TODO，commit 并 push，让 CI 先记录一次失败。`
    : `只修改 \`${WORKSPACE_FILE}\`，完成后 commit 并 push 到你 Fork 中的同名分支。`;
  return `<!-- practice-session:v1 -->
## 练习 ${manifest.exercise}：${title} 已准备好

先阅读[本关教程](${repositoryUrl}/blob/main/${lesson})，再执行下面的命令。教程会解释每条命令的作用和预期输出。

你的专属上游分支是 \`${branch}\`。请在本地执行：

\`\`\`bash
git remote add upstream ${repositoryUrl}.git  # 已添加过 upstream 时跳过
git fetch upstream ${branch}
git switch -c ${head} upstream/${branch}
\`\`\`

${editingInstructions} 然后[创建 Pull Request](${compareUrl})，确认 base 是 \`${branch}\`，并在正文保留 \`Closes #${manifest.issueNumber}\`。

> 练习 PR 合入临时分支，因此 Issue 的关闭由训练机器人代替 GitHub 完成；在真实开源仓库的默认分支 PR 中，同样的 \`Closes\` 写法会原生关联并关闭 Issue。
`;
}

export function exerciseFromLabels(labels = []) {
  const names = labels.map((label) => (typeof label === "string" ? label : label.name));
  for (const [exercise, name] of EXERCISE_LABELS) {
    if (names.includes(name)) return exercise;
  }
  return null;
}

export function shouldHandleIssueEvent(event) {
  if (!event?.issue || event.issue.state !== "open") return false;
  if (["opened", "reopened"].includes(event.action)) return true;
  if (event.action === "labeled") return [...EXERCISE_LABELS.values()].includes(event.label?.name);
  return false;
}

export function shouldSkipGradeEvent(event) {
  if (event?.issue && (!event.issue.pull_request || event.issue.state !== "open")) return true;
  return ["labeled", "unlabeled"].includes(event?.action) && event.label?.name?.startsWith("session:");
}
