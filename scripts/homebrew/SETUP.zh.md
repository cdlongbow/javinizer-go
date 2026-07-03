# Homebrew Tap — 一次性配置

以下步骤创建了 `javinizer/homebrew-tap` 仓库，并授予 `javinizer-go` CI 在每次稳定版本发布时推送 formula 的权限。此操作仅需执行一次；之后，`.github/workflows/cli-release.yml` 中的 `update-homebrew-tap` 作业会自动保持 `Formula/javinizer.rb` 同步。

## 1. 创建 Tap 仓库

在 `javinizer` 组织下创建一个名为 **`homebrew-tap`** 的空公共仓库（不含 README、许可证和 `.gitignore`，保持仓库为空以确保首次 CI 推送干净）：

https://github.com/organizations/javinizer/repositories/new

- 所有者：`javinizer`
- 名称：`homebrew-tap`
- 可见性：**Public**（Homebrew 要求 tap 必须为公开才能使用 `brew install`）
- 初始化：所有选项均不勾选

## 2. 生成 SSH 部署密钥

```bash
ssh-keygen -t ed25519 -C "homebrew-tap deploy key" -f homebrew_tap_deploy_key -N ""
```

生成两个文件：
- `homebrew_tap_deploy_key` — 私钥（存入 CI 密钥）
- `homebrew_tap_deploy_key.pub` — 公钥（添加到 tap 仓库）

## 3. 将公钥添加为 Tap 仓库的写入部署密钥

访问 https://github.com/javinizer/homebrew-tap/settings/keys/new
- 标题：`CI publish from javinizer-go`
- 密钥：粘贴 `homebrew_tap_deploy_key.pub` 的内容
- **允许写入权限：✓**（必需 — CI 需要提交 formula）

## 4. 将私钥添加为 javinizer-go 的密钥

访问 https://github.com/javinizer/javinizer-go/settings/secrets/actions/new
- 名称：`HOMEBREW_TAP_DEPLOY_KEY`
- 密钥：粘贴 `homebrew_tap_deploy_key`（私钥）的内容

## 5. 删除本地私钥

```bash
rm homebrew_tap_deploy_key homebrew_tap_deploy_key.pub
```

## 用户安装方式

v1.0.0 稳定版发布且 CI 作业运行后：

```bash
brew tap javinizer/homebrew-tap https://github.com/javinizer/homebrew-tap
brew install javinizer
brew upgrade javinizer   # 更新到最新的稳定版本
```

## 说明

- Tap 仅针对**稳定版**发布进行更新。预发布版本（`v1.0.0-rc.*`）不会推送至 tap，因此 `brew upgrade` 不会将候选版本分发给用户，除非用户明确降级。
- Formula 安装预构建的二进制文件（CGO/SQLite 已静态链接到每个发布资产中），因此 Homebrew 无需从源码构建或引入 SQLite 依赖。
- `javinizer upgrade`（自升级）通过 Cellar 路径检测是否为 Homebrew 安装，并提示用户运行 `brew upgrade javinizer`，避免两个更新通道冲突。