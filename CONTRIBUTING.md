## 任务

### 认领 issue

创建一个 issue 命名为 `Ex1` 或 `ex1` 或 `练习1` 或 `练习一`，机器人会自动更新任务并将这个 issue 分配给你，请你完成它哦~ 

后续的其他任务就把 `1` 换成 `2`、`3`等其他编号。
 
### 开始编码（TODO）

在点击仓库右上角的 Fork 按钮将在你的账号中创建该仓库的副本。前往你的 GitHub 中的相同仓库，地址通常为 `https://github.com/你的用户名/code-contributing-practice` 接下来将在你自己账号的仓库中操作。

> 如果你不知道以下说的是什么东西，你可能需要尝试 [GitHub Desktop](https://desktop.github.com/) ，这能帮助你少敲一堆命令，减轻学习 Git 的负担。（不过这不代表不用学习 Git）如果你遇到了困难，请向 mentor 求助。

将仓库 clone 到本地，这样本地才有代码，才能对其修改。操作步骤参考 [Cloning a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)

对于本仓库而言，提交的内容具体见 [`records` 目录下的 `README`](https://github.com/FrogDar/code-contributing-practice/tree/main/records)。

### 创建 Pull Request

参考 [Creating a pull request from a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork)

> 同样，如果你遇到了困难，请向 mentor 求助。

在你创建 Pull Request 后，你会看到 checks running ，请留意失败的 checks ，这通常意味着你提交的代码可能存在问题。

在本仓库中主要是对规范性进行检查，如 git message 是否遵守规范？是否在 PR 中关闭对应的 issue 等。

### 等待 Code Review

你提交的 Pull Request 将在 review 后合并入仓库。如果有需要改进的地方，你的 reviewer 会在 Pull Request 下留言，所以请留意你的 reviewer 给你的消息（不过也不用担心，你会收到邮件提醒）。

### Commit 规范

> 本节主要参考自 [`angular`](https://github.com/angular/angular/blob/main/CONTRIBUTING.md) 。
> 更宽松地要求可以参见 [How to Write a Git Commit Message](https://cbea.ms/git-commit/) ，这里给出一些最基本的要求。 感谢 @derecknowayback 的分享。

每一个 Git commit message 由 **header** 和 **body** 组成。

```
<header>
<BLANK LINE>
<body>
```

#### **header**

header 是必须的，格式如下：

```
<type>(<scope>): <short summary>
  │       │     │     │
  │       │     │     └─⫸ 原则上使用英文；使用动词原形开头，首字母不需要大写，句尾不需要句号（整句尽量不超过60词）
  │       │     │ 
  │       │     └─⫸ 冒号后面需要一个半角空格
  │       │ 
  │       └─⫸ Commit Scope: 特定范围（对于本仓库而言一般为空）
  │
  └─⫸ Commit Type: build|ci|docs|feat|fix|perf|refactor|test|style|chore|revert
```

##### Commit Type

* **build**: 影响构建系统或者外部依赖的更改，例如修改 `pom.xml`, `Dockerfile`, `docker-compose.yml` 的更改
* **ci**: 影响到 CI 配置或脚本的更改，例如修改 `gitlab-ci.yml`, Github Actions 的配置文件等
* **docs**: 只修改了文档的更改
* **feat**: 增加新功能的更改
* **fix**: 修复 bug  的更改
* **perf**: 提高了程序性能的更改
* **refactor**: 既没有修复 bug 也没有增加新功能的更改（比如重构代码）
* **test**: 增加或改正测试代码
* **style**: 不改变代码含义的修改（比如格式化代码）
* **chore**: 其他不改变 `src` 或测试代码的修改
* **revert**: 撤回之前的 `commit`

#### scope

commit 所属的范围，例如 `frontend`、`backend` 等。

如果 commit 不属于特定范围，则不用加 scope 。
#### body

body 是可选的，与 header 一样，需要使用动词原形。body 中可以书写比 header 中更详细的信息，比如：

- 为什么做了这个更改
- 受到了什么启发
- 与之前版本的区别
- 功能的详细说明
- ……

#### 样例

```
fix: address an issue where return value can be null

if an incorrect request body is sent to the server, method xxx may respond with a empty body due to xxx
this issue is fixed by improving error handling in the request parser
```
