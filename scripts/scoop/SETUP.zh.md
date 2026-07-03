# Scoop 桶 — 一次性配置

以下步骤创建了 `javinizer/scoop-javinizer` 桶仓库，并授予 `javinizer-go` CI 在每次稳定版本发布时推送清单的权限。此文档作为操作参考，仅需执行一次。

## 1. 创建桶仓库

在 `javinizer` 组织下创建一个名为 **`scoop-javinizer`** 的空公共仓库（不含 README、许可证和 `.gitignore`）：

https://github.com/organizations/javinizer/repositories/new

- 所有者：`javinizer`
- 名称：`scoop-javinizer`
- 可见性：**Public**（Scoop 要求桶必须为公开）
- 初始化：所有选项均不勾选

## 2. 生成 SSH 部署密钥

```bash
ssh-keygen -t ed25519 -C "scoop-javinizer deploy key" -f scoop_bucket_deploy_key -N ""
```

生成两个文件：
- `scoop_bucket_deploy_key` — 私钥（存入 CI 密钥）
- `scoop_bucket_deploy_key.pub` — 公钥（添加到桶仓库）

## 3. 将公钥添加为桶仓库的写入部署密钥

访问 https://github.com/javinizer/scoop-javinizer/settings/keys/new
- 标题：`CI publish from javinizer-go`
- 密钥：粘贴 `scoop_bucket_deploy_key.pub` 的内容
- **允许写入权限：✓**（必需 — CI 需要提交清单）

## 4. 将私钥添加为 javinizer-go 的密钥

访问 https://github.com/javinizer/javinizer-go/settings/secrets/actions/new
- 名称：`SCOOP_BUCKET_DEPLOY_KEY`
- 密钥：粘贴 `scoop_bucket_deploy_key`（私钥）的内容

## 5. 删除本地私钥

```bash
rm scoop_bucket_deploy_key scoop_bucket_deploy_key.pub
```

## 用户安装方式（Windows, Scoop）

v1.0.0 稳定版发布且 CI 作业运行后：

```powershell
scoop bucket add javinizer https://github.com/javinizer/scoop-javinizer
scoop install javinizer
scoop update javinizer   # 更新到最新的稳定版本
```

## 说明

- 桶仅针对**稳定版**发布进行更新。预发布版本（`v1.0.0-rc.*`）不会推送至桶，因此 `scoop update` 不会将候选版本分发给用户。
- 清单（`bucket/javinizer.json`）安装预构建的 `javinizer-windows-amd64.exe` 并将其映射为 `javinizer`。CGO/SQLite 已静态链接到二进制文件中，无需额外运行时。
- 清单包含 `checkver`（仅匹配稳定版的正则）和 `autoupdate` 块，即使 CI 也会为每个版本写入具体版本号和哈希值，该配置仍确保清单符合 Scoop 工具链规范并具备自文档能力。
- `javinizer upgrade`（自升级）通过应用路径检测是否为 Scoop 安装，并提示用户运行 `scoop update javinizer`，避免两个更新通道冲突。