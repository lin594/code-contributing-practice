## 任务

随机变更 md 里的内容

唯一的要求是：在 PR 里不要出现上次提交的 git 记录。

## 方法

### 法一

如果你的仓库单纯比上游仓库较慢（只有 `behind`），那么可以在仓库内点击同步，同步为最新后再开始编码。

![image](https://user-images.githubusercontent.com/20886330/206180947-76205c08-6c33-4dee-85a1-51e82f0d2b23.png)

### 法二

如果又有 `behind` 又有 `ahead` 那么可以删除仓库，重新 Fork 。

### 法三

创建单独的分支，利用单独分支执行相关指令拉取最新请求。

（每次都创建一个新的分支，在那个分支上编码，完成之后就删除新创建的这个分支，保持主分支的干净，那么对于主分支来说就可以使用法一了）

```git
git checkout -b new-branch-name 
git pull upstream master
```