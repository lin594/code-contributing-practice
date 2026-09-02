# Git / GitHub 术语表

| 术语 | 在本课程中的意思 | 容易混淆的点 |
| --- | --- | --- |
| repository / repo | 由 Git 管理的一组文件和历史 | 不只是普通文件夹，它还包含版本历史 |
| working tree / 工作区 | 当前能直接编辑的文件 | 修改后还没有自动进入 commit |
| staging area / 暂存区 | 下一条 commit 准备保存的内容 | `git add` 是选择，不是上传 |
| commit | 一次带作者、时间和说明的版本快照 | commit 在本地；push 后才到 GitHub |
| branch | 指向一串 commit 的可移动名称 | branch 不是仓库的完整副本 |
| `main` | 常见的默认分支名 | 练习必须使用独立 topic branch |
| topic branch | 为一个任务创建的短期分支 | 完成后可以删除，历史仍在 PR 中 |
| remote | 本地保存的远端仓库地址别名 | 它不是“云端分支”本身 |
| `origin` | clone 时自动创建的 remote，本课指你的 Fork | 在别的仓库中它可能指向别处 |
| `upstream` | 手动添加的原仓库 remote | 名称是约定，但开源协作中很常见 |
| Fork | GitHub 上属于你账号的协作副本 | clone 是下载到电脑，Fork 是 GitHub 上复制关系 |
| clone | 把仓库和历史复制到本地 | clone 后默认只有一个 `origin` remote |
| fetch | 获取远端的新 commit 和引用 | 不会自动改写当前工作区 |
| merge | 把另一条历史整合进当前分支 | 分叉时通常产生 merge commit |
| rebase | 把自己的 commit 重新放到新 base 之后 | 会改变 commit ID，已 push 时需谨慎 |
| Issue | 讨论问题、需求或任务的页面 | Issue 不是代码改动 |
| Pull Request / PR | 请求把 head 分支变化合入 base 分支 | 它同时承载 diff、检查、评论和 Review |
| base | PR 想要合入的目标分支 | 本课程是机器人生成的临时分支，不是 `main` |
| head | PR 提供改动的来源分支 | 本课程是你 Fork 中的 topic branch |
| Draft PR | 分享未完成改动、暂不正式请求评审的 PR | Ready for review 后才表示可以正式评审 |
| Review | 对 PR 变化的逐行或总体反馈 | 新 commit push 到同一分支会更新原 PR |
| conflict | Git 无法自动判断如何组合的竞争变化 | 解决冲突是做内容决定，不是删除标记就结束 |
| CI / check | PR 上自动运行的检查 | 红灯先看具体日志或机器人“怎么做” |
| SHA | commit 的唯一标识符 | 历史重写后同一内容也可能有不同 SHA |

记不清时不必猜：先运行 `git status`，再回到对应教程或[速查表](git-cheatsheet.md)。
