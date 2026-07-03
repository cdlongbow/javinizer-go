# Javinizer Go

日本成人影片（JAV）元数据抓取与文件整理工具，提供 CLI、TUI、REST API 和 Web UI 四种交互方式。使用 Go 语言重构自原版 [Javinizer](https://github.com/jvlflame/Javinizer)。

[![Go Version](https://img.shields.io/badge/Go-1.26+-00ADD8?style=flat&logo=go)](https://go.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Test & Coverage](https://github.com/javinizer/javinizer-go/actions/workflows/test.yml/badge.svg)](https://github.com/javinizer/javinizer-go/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/javinizer/javinizer-go/branch/main/graph/badge.svg)](https://codecov.io/gh/javinizer/javinizer-go)
[![Discord](https://img.shields.io/discord/608449512352120834?color=brightgreen&style=plastic&label=discord)](https://discord.gg/Pds7xCpzpc)
[![latest release](https://img.shields.io/github/v/release/javinizer/javinizer-go?label=latest%20release)](https://github.com/javinizer/javinizer-go/releases)

---

## 快速开始

体验 Javinizer 最快的方式是使用 Docker — 一条命令即可启动 Web UI：

```bash
mkdir -p ./data
curl -o ./data/config.yaml \
  https://raw.githubusercontent.com/javinizer/javinizer-go/main/configs/config.yaml.example

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -p 8080:8080 \
  -v "$(pwd)/data:/javinizer" \
  -v "/path/to/your/media:/media" \
  ghcr.io/javinizer/javinizer-go:latest
```

打开 **http://localhost:8080**，首次启动时创建管理员账号，即可开始抓取。

- 将 `/path/to/your/media` 替换为你的 JAV 媒体库路径。
- 在 Unraid 上使用 `--user 99:100`。
- 如需本地安装，推荐使用 [Homebrew](#homebrew-macos--linux)、[一键安装脚本](#一键安装-linux--macos--windows)、[预编译二进制](#预编译二进制手动下载) 或 [从源码编译](#从源码编译)。

> **第一次使用？** 先浏览[功能特性](#功能特性)了解它能做什么，然后跳转到[使用方法](#使用方法)或 [Web UI](#web-ui) 章节。

---

## 功能特性

| 功能 | 说明 | 优势 |
|---|---|---|
| 多源抓取 | 从 R18.dev、DMM/Fanza 等 12+ 个来源拉取元数据 | 匹配质量更高，字段缺失更少 |
| 智能文件整理 | 使用模板重命名和组织文件/文件夹 | 保持大型媒体库的一致性和可搜索性 |
| 安全预览模式 | 在实际操作前显示完整预览 | 降低批量处理文件时的风险 |
| NFO 文件生成 | 创建 Kodi/Plex 兼容的 NFO 元数据文件 | 改善媒体中心的索引和显示质量 |
| 媒体文件下载 | 下载封面、海报、剧照、预告片和女优图片 | 生成完整精美的媒体库条目 |
| 手动抓取 | 批量运行前可逐文件指定 ID/URL 覆盖 | 处理文件名中不含有效 JAV ID 的文件 |
| 多种界面 | 支持 CLI、交互式 TUI、REST API 和 Web UI | 快速自动化或手动审查，任你选择 |

## 支持的抓取源

| 抓取源 | 默认启用 | 语言 | 说明 |
|---|---|---|---|
| `r18dev` | 是 | `en`, `ja` | JSON API 抓取，自带速率限制处理 |
| `dmm` | 否 | N/A | 可选浏览器模式处理 JS 渲染页面 |
| `libredmm` | 否 | N/A | 聚合 Fanza、MGStage、SOD 和 FC2 |
| `mgstage` | 否 | N/A | 通常需要年龄验证 cookie（`adc=1`） |
| `javlibrary` | 否 | `en`, `ja`, `cn`, `tw` | 可使用 FlareSolverr 处理 Cloudflare 验证 |
| `javdb` | 否 | N/A | 可使用 FlareSolverr；支持代理 |
| `javbus` | 否 | `ja`, `en`, `zh` | 多语言支持 |
| `jav321` | 否 | N/A | 备选索引源 |
| `tokyohot` | 否 | `ja`, `en`, `zh` | Tokyo-Hot 专用源 |
| `aventertainment` | 否 | `en`, `ja` | 可选的屏幕截图抓取 |
| `dlgetchu` | 否 | N/A | DLsite/Getchu 相关源 |
| `caribbeancom` | 否 | `ja`, `en` | Caribbeancom 专用源 |
| `fc2` | 否 | N/A | FC2 源 |
| `javstash` | 否 | `en`, `ja` | GraphQL API 抓取；需要从 javstash.org 获取 API Key |

---

## 安装

### Docker（推荐）

参见上方的[快速开始](#快速开始)。如需完整配置（含可选的 FlareSolverr 支持），请使用 Docker Compose：

```bash
curl -o .env https://raw.githubusercontent.com/javinizer/javinizer-go/main/.env.example
curl -o docker-compose.yml https://raw.githubusercontent.com/javinizer/javinizer-go/main/docker-compose.yml
# 编辑 .env：MEDIA_PATH=/path/to/your/library, PUID, PGID, TZ
docker-compose up -d
```

Compose 文件包含 **javinizer**（API + Web UI）和可选的 **flaresolverr**（用于 JavDB/JavLibrary 的 Cloudflare 验证）。详见 [Docker 部署指南](./docs/docker-deployment.zh.md)。

**标签策略：** `latest` 追踪最新发布版本；建议固定版本（如 `v1.0.0`）以确保可重复部署。

### Homebrew（macOS / Linux）

通过 Homebrew tap 安装（macOS 推荐）：

```bash
brew tap javinizer/homebrew-tap https://github.com/javinizer/homebrew-tap
brew trust --formula javinizer/tap/javinizer   # Homebrew 6.0+ 只需执行一次
brew install javinizer

brew upgrade javinizer   # 后续更新到最新稳定版
```

Homebrew 6.0+ 要求在使用第三方 tap 前显式信任。`brew trust` 步骤对每个 tap 只需执行一次；也可以设置 `HOMEBREW_NO_REQUIRE_TAP_TRUST=1` 跳过检查。该 formula 安装的是预编译二进制文件（CGO/SQLite 已静态链接到每个发布包中），因此 Homebrew 不会从源码编译或引入 SQLite 依赖。tap 在每个**稳定版**发布时自动更新；预发布版本永远不会进入 tap，所以 `brew upgrade` 不会意外安装候选发布版。

### Scoop（Windows）

通过 Scoop bucket 安装（Windows 推荐）：

```powershell
scoop bucket add javinizer https://github.com/javinizer/scoop-javinizer
scoop install javinizer

scoop update javinizer   # 后续更新到最新稳定版
```

该 manifest 安装预编译的 `javinizer-windows-amd64.exe` 并将其作为 `javinizer` 命令注册。bucket 在每个**稳定版**发布时自动更新；预发布版本永远不会进入 bucket，所以 `scoop update` 不会意外安装候选发布版。Scoop 通过可信流程下载并校验 manifest 中的哈希值，是 Windows 上推荐的安装方式。

### 一键安装（Linux / macOS / Windows）

安装脚本会下载最新**稳定版**，通过 `checksums.txt` 校验 SHA256，然后将 `javinizer` 添加到系统 `PATH`。预发布版本需要手动选择：使用 `--pre-release`（Linux/macOS）或 `-PreRelease`（Windows）参数安装包含预发布版的最新版本。

**Linux / macOS：**

```bash
curl -sSL https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.sh | bash
# 安装最新的预发布版本：
curl -sSL https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.sh | bash -s -- --pre-release
```

**Windows**（PowerShell）— 安装到 `%LOCALAPPDATA%\javinizer\bin`（无需管理员权限）：

```powershell
irm https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.ps1 | iex
# 安装最新的预发布版本：
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.ps1))) -PreRelease
```

Windows 安装脚本还会对下载的二进制文件执行 `Unblock-File`，移除可能导致 Smart App Control 报"访问被拒绝"错误的 Web 标记。

### 预编译二进制（手动下载）

从 [GitHub Releases](https://github.com/javinizer/javinizer-go/releases) 下载 — 提供 `linux-amd64`、`linux-arm64`、`darwin-amd64`、`darwin-arm64`、`darwin-universal` 和 `windows-amd64` 版本。二进制文件包含 CLI、TUI、API 服务器和内嵌的 Web UI。

**Linux / macOS：**

```bash
# 1. 从 Releases 页面下载对应操作系统/架构的包：
#    https://github.com/javinizer/javinizer-go/releases（例如 javinizer-linux-amd64）
# 2. 赋予执行权限并放入 PATH：
chmod +x javinizer
sudo mv javinizer /usr/local/bin/

javinizer version
```

> **一键下载：** `releases/latest` 始终指向最新稳定版，可直接下载无需指定版本号：
> ```bash
> curl -L -o javinizer https://github.com/javinizer/javinizer-go/releases/latest/download/javinizer-linux-amd64
> ```
> 预发布版本不会成为 GitHub 上的"最新"版本，因此该永久链接始终指向稳定版。

**Windows：**

从 [Releases 页面](https://github.com/javinizer/javinizer-go/releases) 下载 `javinizer-windows-amd64.exe`，然后在 PowerShell 中运行：

```powershell
# 可选：重命名以便使用
Rename-Item javinizer-windows-amd64.exe javinizer.exe

# 在相同目录下运行
.\javinizer.exe version
```

> **Windows 11 + Smart App Control：** Windows 发布版尚未签名 Authenticode。如果 Smart App Control 处于强制模式，可能会阻止未签名的二进制文件并报"访问被拒绝"。上述一键安装脚本 `install.ps1` 会自动执行 `Unblock-File`；如果手动下载，可通过右键单击 `.exe` → 属性 → 勾选**解除锁定** → 确定来解除锁定（等同于执行 `Unblock-File .\javinizer.exe`），或者从源码编译（本地编译的二进制文件不带 Web 标记，不受 SAC 限制）。

如需在任何位置运行 `javinizer`，将其所在文件夹添加到 `PATH`（系统属性 → 环境变量 → Path → 新建），或者将 `javinizer.exe` 复制到已在 `PATH` 中的文件夹。

```powershell
# 启动 Web UI，然后打开 http://localhost:8080
.\javinizer.exe init
.\javinizer.exe web
```

> Windows 版包含 CLI/TUI/API + 内嵌 Web UI，与其他平台相同。CGO/SQLite 已静态链接，无需单独安装运行时。

### 自我升级

使用二进制或 `install.sh` 安装后，无需手动重新下载即可原地更新：

```bash
javinizer upgrade           # 下载 + 校验 + 替换运行中的二进制文件
javinizer upgrade --check   # 仅检查是否有可用更新
javinizer upgrade --force   # 即使已是最新版本也重新安装
javinizer upgrade --prerelease  # 升级到最新版本（含预发布版）
```

新二进制文件在替换前会通过发布包的 `checksums.txt` 校验。如果 javinizer 是通过 **Homebrew** 或 **Scoop** 安装的，`upgrade` 命令会检测到并提示使用 `brew upgrade javinizer` / `scoop update javinizer`，不会覆盖包管理器的安装。

默认情况下 `upgrade` 针对最新**稳定版**。添加 `--prerelease` 可在需要跟踪预发布版时升级到较新的候选版（如 `v1.1.0-rc1`）。

> 注意：`javinizer upgrade` 更新的是**程序本身**；`javinizer update` 刷新的是已有文件的**元数据**。这是两个不同的命令。

### 从源码编译

需要 Go 1.26+ 和 CGO（用于 SQLite）。内嵌 Web UI 还需要 Node.js 20+（CI 中使用 Node 22）。

```bash
go install github.com/javinizer/javinizer-go/cmd/javinizer@latest

# 或克隆仓库并构建包含内嵌 Web UI 的单一二进制文件：
git clone https://github.com/javinizer/javinizer-go.git
cd javinizer-go
make build
./bin/javinizer version
```

`make build` 会编译前端资源包并将其嵌入 Go 二进制文件。如果只需要 CLI 版本（不含前端）：`go build -o bin/javinizer ./cmd/javinizer`。

---

## 使用方法

### 启动 Web UI

```bash
javinizer init          # 创建默认 config.yaml + 数据库
javinizer web           # 在 http://localhost:8080 启动服务器
# 自定义端口/主机：
javinizer web --host 0.0.0.0 --port 8081
```

`web` 是 `api` 的别名 — 同一个服务器。使用 `web` 作为内嵌 UI 入口，`api` 用于后端/前端开发工作流。首次启动时，Web UI 会提示你创建管理员账号（保存在配置文件旁的 `auth.credentials.json` 中）。删除该文件可重置密码。

### 整理文件夹

```bash
javinizer sort ~/Videos --dry-run   # 先预览重命名/移动操作
javinizer sort ~/Videos             # 实际执行抓取 + 整理
```

### 抓取单个 ID

```bash
javinizer scrape IPX-535
javinizer scrape SSIS-123 --force   # 强制刷新缓存元数据
```

### 原地更新元数据

重新抓取并合并到已整理的文件中（支持合并预设/策略）：

```bash
javinizer update ~/Videos/IPX-535
javinizer update ~/Videos --dry-run
```

### 交互式 TUI

```bash
javinizer tui ~/Videos
```

键盘快捷键和工作流程参见 [TUI 指南](./docs/11-tui.zh.md)。

### 管理媒体库

```bash
# 标签（写入 NFO 文件）
javinizer tag add IPX-535 "favorite" "4K"
javinizer tag search "favorite"

# 类型 / 词语替换规则
javinizer genre add "Creampie" "Cream Pie"
javinizer word add "censored" "original"

# 女优数据库
javinizer actress merge --target <id> --source <id>   # 合并重复条目
javinizer actress export

# 历史与日志
javinizer history list
javinizer logs list

# API 令牌（用于程序化访问）
javinizer token create
javinizer token list --json

# 配置与版本
javinizer config migrate      # 将旧版配置升级到当前 schema
javinizer info                # 显示配置、抓取源和数据库状态
javinizer version --check     # 显示版本号并检查更新
```

所有命令和参数参见 [CLI 参考](./docs/03-cli-reference.zh.md)。

---

## Web UI

Docker 版和二进制版均包含（内嵌），访问 `http://localhost:8080`。

| 页面 | 功能说明 |
|---|---|
| **控制台** | 快速统计和近期活动 |
| **浏览** | 查看已整理的影片（含封面和元数据）；发送文件进行手动抓取 |
| **手动** | 批量运行前逐文件指定 JAV ID/URL 覆盖（处理文件名不含有效 ID 的文件） |
| **审查** | 批量抓取文件、裁剪海报、在整理前编辑元数据 |
| **任务** | 通过实时 WebSocket 监控批量任务进度 |
| **女优** | 浏览女优数据库（含图片） |
| **历史** | 查看和回滚整理操作 |
| **设置** | 配置抓取源、输出模板和代理设置 |

**API 文档** 与 UI 一同提供：[Scalar UI](http://localhost:8080/docs) 和 [Swagger UI](http://localhost:8080/swagger/index.html)。端点文档参见 [API 参考](./docs/07-api-reference.zh.md)。

### Web 开发

**生产构建（含内嵌 UI 的单一二进制文件）：**
```bash
make build && javinizer web
```

**开发模式（热重载）：**
```bash
javinizer api        # 终端 1：后端
make web-dev         # 终端 2：前端在 http://localhost:5174（API 代理到 :8080）
```

详见 `web/frontend/README.md`。

---

## 配置

Javinizer 使用 YAML 配置文件。运行 `javinizer init` 初始化，然后编辑配置文件。

**主要配置项：**
- **抓取源** — 启用/禁用数据源、设置优先级、配置代理
- **元数据** — 逐字段设置抓取源优先级、翻译、类型过滤、词语替换
- **输出** — 文件夹/文件命名模板、下载选项
- **文件匹配** — 扩展名、大小过滤、正则表达式
- **NFO** — Kodi/Plex 元数据格式选项

**逐字段优先级语义：** 逐字段的抓取源列表是**排他性的**（不会回退到全局优先级）。不存在的键或空列表 `[]` 会继承全局优先级；`["__skip__"]` 使该字段留空。完整 schema 见[配置指南](./docs/02-configuration.zh.md)，示例见[样例配置](./configs/config.yaml.example)。

### 多语言模板标签

模板标签可以为翻译字段选择语言：

```yaml
output:
  folder_format: <ID> [<MAKER:JA>] - <TITLE:EN> (<YEAR>)
# → ROYD-191 [ROYD] - A Beautiful Day (2024)
```

- `<TITLE:EN>` — 英文标题；`<TITLE:JA\|EN>` — 日文标题，回退到英文
- 支持的标签：`TITLE`、`MAKER`、`LABEL`、`SERIES`、`DIRECTOR`、`DESCRIPTION`、`ORIGINALTITLE`、`STUDIO`（`MAKER` 的同义词）
- 语言代码为小写 2 字母（`en`、`ja`、`zh` 等）；区域变体将归一化为基础语言

完整语法和函数参见[模板系统](./docs/04-template-system.zh.md)。

---

## 环境变量

Docker 部署支持通过环境变量覆盖配置。

### 核心

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PUID` / `PGID` | 容器进程的运行用户/组 ID | `1000` |
| `USER_ID` / `GROUP_ID` | `PUID`/`PGID` 的旧版别名 | `1000` |
| `JAVINIZER_CONFIG` | 配置文件路径 | `/javinizer/config.yaml` |
| `JAVINIZER_DB` | SQLite 数据库路径 | `/javinizer/javinizer.db` |
| `JAVINIZER_LOG_DIR` | 将日志文件重定位到该目录 | `/javinizer/logs` |
| `JAVINIZER_TEMP_DIR` | 下载临时目录 | `data/temp` |
| `LOG_LEVEL` | 日志详细程度 | `info` |
| `UMASK` | 文件权限掩码 | `002` |
| `TZ` | 日志时区 | `UTC` |

### 翻译与抓取源 API Key

| 变量 | 用途 |
|---|---|
| `TRANSLATION_PROVIDER` | `openai`、`deepl`、`google` 或 `anthropic` |
| `TRANSLATION_SOURCE_LANGUAGE` / `TRANSLATION_TARGET_LANGUAGE` | 例如 `ja` → `en` |
| `OPENAI_API_KEY` / `DEEPL_API_KEY` / `GOOGLE_TRANSLATE_API_KEY` / `ANTHROPIC_API_KEY` | 各服务商的密钥 |
| `JAVSTASH_API_KEY` | JavStash GraphQL API 密钥（从 javstash.org 获取） |

### 开发

| 变量 | 用途 |
|---|---|
| `CHROME_BIN` | 浏览器抓取的 Chrome 二进制路径 |
| `GH_TOKEN` | GitHub 令牌（避免更新检查时的速率限制） |

```bash
docker run --rm \
  -e LOG_LEVEL=debug -e TZ=Asia/Tokyo \
  -p 9000:8080 \
  -v "$(pwd)/data:/javinizer" -v "/media/jav:/media" \
  ghcr.io/javinizer/javinizer-go:latest
```

Docker Compose 配置参见 `.env.example`。

---

## 文档

| 指南 | 内容 |
|---|---|
| [入门指南](./docs/01-getting-started.zh.md) | 安装和首次使用 |
| [Docker 部署](./docs/docker-deployment.zh.md) | 容器设置与管理 |
| [配置](./docs/02-configuration.zh.md) | 配置文件参考 |
| [CLI 参考](./docs/03-cli-reference.zh.md) | 所有命令和参数 |
| [TUI 指南](./docs/11-tui.zh.md) | 交互式终端 UI |
| [API 参考](./docs/07-api-reference.zh.md) | REST API 端点 |
| [模板系统](./docs/04-template-system.zh.md) | 输出命名模板 |
| [类型管理](./docs/05-genre-management.zh.md) | 类型替换规则 |
| [用户指南](./docs/14-user-guide.zh.md) | Web UI 工作流程 |
| [架构](./docs/16-architecture.zh.md) | 系统架构概述 |
| [开发](./docs/09-development.zh.md) | 贡献和开发环境搭建 |
| [测试](./docs/12-testing-guide.zh.md) | 测试实践与覆盖率 |
| [故障排除](./docs/10-troubleshooting.zh.md) | 常见问题与解决方案 |

## 支持

- **问题反馈**：[github.com/javinizer/javinizer-go/issues](https://github.com/javinizer/javinizer-go/issues)
- **讨论**：[github.com/javinizer/javinizer-go/discussions](https://github.com/javinizer/javinizer-go/discussions)
- **Discord**：[邀请链接](https://discord.gg/Pds7xCpzpc)

## 许可证

MIT 许可证 — 参见 [LICENSE](LICENSE)。本项目是原版 [Javinizer](https://github.com/jvlflame/Javinizer) 的 Go 语言重构版本。