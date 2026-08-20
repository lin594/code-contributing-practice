import {
  EXERCISE_LABELS,
  SCHEMA_VERSION,
  SESSION_BRANCH,
  SESSION_FILE,
  WORKSPACE_FILE,
} from "./constants.mjs";

export function branchNameFor({ exercise, issueNumber, actor }) {
  if (!Number.isInteger(exercise) || exercise < 1 || exercise > 4) {
    throw new Error("exercise must be an integer from 1 to 4");
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
      ["active", "review-requested", "conflict-injected", "completed"].includes(manifest.state)
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

请把两处 \`TODO\` 替换成你自己的内容。
`,
    2: `# 干净的提交历史

## 我学到的 Git 命令

TODO：请在第一个 commit 中填写。

## 为什么要保持提交历史干净

TODO：请在第二个 commit 中填写。
`,
    3: `# 响应 Code Review

状态：初稿

## 本次修改

TODO：先写下你的初稿并创建 PR。机器人会在 PR 中提出修改要求。
`,
    4: `# 解决上游冲突

## 最终决定

最终内容：待填写

创建 PR 前，请把“待填写”改成“我的修改”。机器人随后会更新上游的同一行。
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
  const compareUrl = `${repositoryUrl}/compare/${encodeURIComponent(branch)}...${encodeURIComponent(`${manifest.actor}:${head}`)}?expand=1&template=exercise.md`;
  return `<!-- practice-session:v1 -->
## 练习 ${manifest.exercise} 已准备好

你的专属上游分支是 \`${branch}\`。请在本地执行：

\`\`\`bash
git remote add upstream ${repositoryUrl}.git  # 已添加过 upstream 时跳过
git fetch upstream ${branch}
git switch -c ${head} upstream/${branch}
\`\`\`

只修改 \`${WORKSPACE_FILE}\`，完成后 commit 并 push 到你 Fork 中的同名分支。然后[创建 Pull Request](${compareUrl})，确认 base 是 \`${branch}\`，并在正文保留 \`Closes #${manifest.issueNumber}\`。

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
  return ["labeled", "unlabeled"].includes(event?.action) && event.label?.name?.startsWith("session:");
}
