# code-contributing-practice

> 欢迎来到开源贡献练习场！本仓库旨在帮助你熟悉并掌握向开源项目贡献代码的标准流程，包括 fork、git branch、pull request (PR) 等核心操作。

## 为仓库贡献代码应当怎么做？

### 1. 准备工作

- **阅读贡献指南**：在项目根目录找到并阅读 `CONTRIBUTING.md` 文件，了解代码规范。
- **认领 Issue**：找到或创建一个 `Issue`，评论表示你希望处理它，并等待分配。

### 2. 本地开发

1.  **Fork 仓库**：点击原始仓库右上角的 `Fork` 按钮，复制一份到你的 GitHub 账号下。

2.  **Clone 到本地**：
    ```bash
    # 将 YOUR_USERNAME 替换为你的 GitHub 用户名
    git clone [https://github.com/YOUR_USERNAME/code-contributing-practice.git](https://github.com/YOUR_USERNAME/code-contributing-practice.git)
    cd code-contributing-practice
    ```

3.  **创建特性分支**：**不要在 `main` 分支上直接修改。**
    ```bash
    # 分支名应清晰并与任务相关，例如：fix/issue-123
    git checkout -b feature/my-first-contribution
    ```
    
4.  **(可选) 同步上游仓库**：在开始修改前，获取原始仓库的最新代码以避免冲突。
    ```bash
    git remote add upstream [https://github.com/FrogDar/code-contributing-practice.git](https://github.com/FrogDar/code-contributing-practice.git)
    git fetch upstream
    git checkout main
    git merge upstream/main
    git checkout feature/my-first-contribution
    git rebase main # 将你的分支变基到最新的 main 分支上
    ```

5.  **修改与提交**：完成代码修改后，按照规范提交。
    ```bash
    git add .
    git commit -m "feat(records): add practice file for YOUR_NAME"
    ```

6.  **推送至你的 Fork 仓库**：
    ```bash
    git push origin feature/my-first-contribution
    ```

### 3. 创建 Pull Request (PR)

-  **发起 PR**：在你的 Fork 仓库页面，点击 `Compare & pull request` 按钮。
-  **填写描述**：
    - **标题**：清晰概括你的修改。
    - **关联 Issue**：在描述中写入 `close #123` （`123` 为对应的 Issue 编号），PR 合并后会自动关闭该 Issue。

### 4. 代码审查

- **等待审查**：维护者会对你的代码进行审查并提出修改意见。
- **更新代码**：若有修改，直接在本地的同一分支上继续 `commit` 和 `push`，PR会自动同步更新。
- **合并**：PR 被批准并合并后，你就完成了一次贡献！
## 练习

> 在练习中提交的内容没有限制，可以是在 `records` 文件夹下提交一个属于自己的 `.md` 文件，也可以是完善本仓库。
>
> 需要注意的是，练习失败的那些产物对于新手来说只能是删掉再来一次。当然你也可以通过提升自己的 git 水平，用一些奇淫巧技拯救此前错误的练习结果。

### 练习一：完成第一次贡献

- **目标**：完整体验一次标准的 Fork & PR 流程。
- **步骤**：
    1. 创建一个 Issue，标题为 `Ex1` 或 `练习一`，机器人会自动分配给你。
    2. 严格遵循上述标准流程。
    3. 遵守 [`CONTRIBUTING.md`](https://github.com/FrogDar/code-contributing-practice/blob/main/CONTRIBUTING.md) 中的规范（比如 git message 要使用[`angular` 规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md)）。

### 练习二：处理多个提交

- **目标**：学习在同一 PR 中进行多次提交，并保持提交历史的干净。
- **步骤**：
    1. 创建一个 Issue，标题为 `Ex2` 或 `练习二`。
    2. **务必为本次练习创建一条新分支**。
    3. 确保本次 PR 不包含上一次练习的提交记录。

## TODO

- [x] 基本文字介绍
- [x] 完成第一个贡献流程
- [x] 完成一次手动评判
- [x] 利用 `GitHub Actions` 自动评判流程并给予提示
- [ ] 更为充实的文字介绍
