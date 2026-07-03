# Docker 部署指南

本指南说明如何使用 Docker 和 Docker Compose 部署 Javinizer。

## 目录

- [快速开始](#快速开始)
- [前置条件](#前置条件)
- [构建镜像](#构建镜像)
- [使用 Docker Compose 运行](#使用-docker-compose-运行)
- [卷结构](#卷结构)
- [配置](#配置)
- [开发模式](#开发模式)
- [故障排除](#故障排除)
- [Docker 命令参考](#docker-命令参考)
- [安全考虑](#安全考虑)
- [生产部署](#生产部署)
- [部署目标](#部署目标)
- [构建流水线](#构建流水线)
- [回滚流程](#回滚流程)
- [监控](#监控)
- [下一步](#下一步)
- [支持](#支持)

---

## 快速开始

启动 Javinizer 的最快方式：

```bash
# 1. 克隆仓库
git clone https://github.com/javinizer/javinizer-go.git
cd javinizer-go

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 设置你的 PUID、PGID 和 MEDIA_PATH

# 3. 使用 Docker Compose 运行（从 GHCR 拉取预构建镜像）
docker-compose up -d

# 4. 访问 Web UI
open http://localhost:8080
```

要在本地构建镜像而非拉取预构建镜像，请参阅[构建镜像](#构建镜像)。

---

## 前置条件

- **Docker**：20.10+（[安装 Docker](https://docs.docker.com/get-docker/)）
- **Docker Compose**：2.0+（包含在 Docker Desktop 中）
- **磁盘空间**：运行时镜像需要约 1 GB 可用空间（包含用于浏览器自动化的 Chromium）以及你的 JAV 库空间

---

## 构建镜像

### 本地构建

在本地构建镜像，包含版本信息：

```bash
docker build \
  --build-arg VERSION=$(git describe --tags --always) \
  --build-arg COMMIT=$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u '+%Y-%m-%d_%H:%M:%S') \
  -t javinizer:latest \
  .
```

> **注意：** 默认的 `docker-compose.yml` 从 `ghcr.io/javinizer/javinizer-go:latest` 拉取预构建镜像，且其 `build:` 部分被注释掉。要使用 Compose 运行本地构建的镜像，需编辑 `docker-compose.yml`：注释掉 `image:` 行并取消注释 `build:` 部分。

### 构建过程

Dockerfile 使用多阶段构建：

1. **阶段 1（frontend-builder）**：使用 Node.js 20（`node:20-alpine`）构建 SvelteKit 前端
2. **阶段 2（go-builder）**：使用 CGO SQLite 支持编译 Go 二进制（`golang:1.26-alpine`）
3. **阶段 3（runtime）**：`alpine:3.21` 运行时镜像，捆绑 Chromium（用于浏览器自动化）、其字体库（`nss`、`freetype`、`harfbuzz`、`ttf-freefont`）、SQLite 和 `su-exec`。Chromium 及其支持库是最大的依赖，因此运行时镜像未压缩时数百 MB——请相应分配磁盘空间。

**构建时间**：现代硬件上约 2-3 分钟

---

## 使用 Docker Compose 运行

### 基本用法

`docker-compose.yml` 提供生产就绪的配置：

```bash
# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重启容器
docker-compose restart
```

### 更新应用

```bash
# 从 GHCR 拉取最新镜像
docker-compose pull

# 使用新镜像重启
docker-compose up -d
```

如果在本地构建（`docker-compose.yml` 中启用了 `build:` 部分），请用 `docker-compose build` 替代 `docker-compose pull`。

---

## 使用 .env 文件配置

Javinizer 使用 `.env` 文件配置 Docker Compose 变量。这使得无需编辑 `docker-compose.yml` 即可轻松自定义部署。

### 设置

1. **复制示例 env 文件**：
   ```bash
   cp .env.example .env
   ```

2. **使用你的设置编辑 `.env`**：
   ```bash
   # 必需：将容器用户与主机用户匹配（防止权限问题）
   # Unraid 常用 PUID=99 和 PGID=100
   PUID=1000        # 运行：id -u
   PGID=1000       # 运行：id -g

   # 必需：设置你的 JAV 库路径
   MEDIA_PATH=/Users/you/JAV

   # 可选：如果 8080 被占用则更改端口
   HOST_PORT=8080

   # 可选：设置你的时区
   TZ=America/New_York
   ```

3. **启动容器**：
   ```bash
   docker-compose up -d
   ```

### 可用变量

| 变量 | 描述 | 默认值 | 必需 |
|----------|-------------|---------|----------|
| `PUID` | 容器的用户 ID（运行 `id -u`） | 1000 | 推荐 |
| `PGID` | 容器的组 ID（运行 `id -g`） | 1000 | 推荐 |
| `USER_ID` | `PUID` 的旧别名 | 1000 | 可选 |
| `GROUP_ID` | `PGID` 的旧别名 | 1000 | 可选 |
| `MEDIA_PATH` | 主机上 JAV 库的路径 | `/path/to/your/jav-library` | 是 |
| `HOST_PORT` | 主机上暴露的端口 | 8080 | 否 |
| `TZ` | 时区（IANA 格式） | UTC | 否 |
| `UMASK` | 文件创建掩码（例如 `002`、`022`）；覆盖 `config.yaml` | `002` | 否 |
| `LOG_LEVEL` | 日志详细程度（`debug`、`info`、`warn`、`error`）；覆盖 `config.yaml` | `info` | 否 |
| `JAVINIZER_TEMP_DIR` | 文件处理的临时目录 | `/javinizer/temp` | 否 |
| `JAVINIZER_SETUP_TRUSTED_CIDRS` | 首次运行 `/auth/setup` 端点的可信 CIDR（Docker 桥接网关） | `172.16.0.0/12` | 否 |
| `JAVINIZER_SETUP_SECRET` | 作为 `X-Setup-Secret` 头发送给 `/auth/setup` 的引导密钥（优先于 CIDR 检查） | _（未设置）_ | 否 |
| `FLARESOLVERR_HOST_PORT` | 可选 FlareSolverr 服务的主机端口 | 8191 | 否 |
| `FLARESOLVERR_LOG_LEVEL` | FlareSolverr 日志详细程度 | `info` | 否 |
| `FLARESOLVERR_LOG_HTML` | 记录 FlareSolverr HTML 响应 | `false` | 否 |
| `FLARESOLVERR_CAPTCHA_SOLVER` | FlareSolverr 验证码求解器 | `none` | 否 |

### 替代方案：命令行变量

你也可以在命令行设置变量（覆盖 `.env`）：

```bash
PUID=$(id -u) PGID=$(id -g) docker-compose up -d
```

---

## 卷结构

Javinizer 使用 **2 卷架构**：

### 卷 1：应用状态 (`/javinizer`)

包含所有应用数据：
- `config.yaml` - 配置文件
- `javinizer.db` - SQLite 数据库（缓存的元数据）
- `logs/` - 应用日志
- `cache/` - 临时缓存文件
- `temp/` - 临时文件（海报处理等）

**主机挂载**：`./data:/javinizer`

### 卷 2：媒体文件 (`/media`)

用于扫描和组织的 JAV 库：
- 组织操作需要读写访问
- 可以是主机上的任何目录

**主机挂载**：`/path/to/your/jav-library:/media`

### 示例目录结构

```
/Users/you/
├── javinizer-go/          # 项目根目录
│   └── data/              # 应用状态（由 Docker 创建）
│       ├── config.yaml
│       ├── javinizer.db
│       └── logs/
└── JAV/                   # 你的媒体库
    ├── IPX-123.mp4
    └── ABW-456.mkv
```

**docker-compose.yml**：
```yaml
volumes:
  - ./data:/javinizer                         # 应用状态（相对路径）
  - /Users/you/JAV:/media                     # 媒体文件（绝对路径）
```

---

## 配置

### 环境变量

通过 `.env` 文件（推荐）或直接在 `docker-compose.yml` 中配置：

```yaml
environment:
  # 应用主目录
  - JAVINIZER_HOME=/javinizer

  # 配置文件位置
  - JAVINIZER_CONFIG=/javinizer/config.yaml

  # 数据库位置
  - JAVINIZER_DB=/javinizer/javinizer.db

  # 日志目录（仅当 logging.output 包含文件目标时适用）
  - JAVINIZER_LOG_DIR=/javinizer/logs

  # 文件处理的临时目录
  - JAVINIZER_TEMP_DIR=/javinizer/temp

  # 首次运行 /auth/setup 端点的可信 CIDR。在 Docker 中，主机通过桥接网关到达容器，从容器视角来看这不是 localhost；
  # 没有这个设置，setup 只能从容器内部访问。
  - JAVINIZER_SETUP_TRUSTED_CIDRS=172.16.0.0/12

  # 时区（影响日志时间戳）
  - TZ=America/New_York
```

`JAVINIZER_LOG_DIR` 仅重写已在 `logging.output` 中配置的文件路径。
如果 `logging.output` 仅为 `stdout`/`stderr`，则不会创建日志文件。

示例：
- `logging.output: stdout` + `JAVINIZER_LOG_DIR=/javinizer/logs` -> 仅容器日志
- `logging.output: "stdout,data/logs/javinizer.log"` + `JAVINIZER_LOG_DIR=/javinizer/logs` -> 容器日志 + `/javinizer/logs/javinizer.log`

**注意**：挂载在 `/media` 的媒体目录会自动检测并添加到允许的目录。无需额外配置。

### 配置文件

在主机上编辑 `./data/config.yaml`：

```yaml
server:
  host: "0.0.0.0"
  port: 8080

scrapers:
  priority: ["r18dev", "dmm"]

  # HTTP/SOCKS5 代理配置（可选）。
  # 连接设置位于命名配置文件下；抓取器使用 `profile:` 选择一个。
  # 顶级 `url:` 被视为遗留字段并被拒绝。
  proxy:
    enabled: true
    default_profile: "main"
    profiles:
      main:
        url: "http://proxy.example.com:8080"
        # username: ""   # 可选身份验证
        # password: ""   # 可选身份验证

output:
  # 组织操作的目标目录在运行时配置
  #（例如 `javinizer sort --dest /media/organized` 或通过 Web UI/API），
  # 不在 config.yaml 中。
  folder_format: "<ID> [<STUDIO>] - <TITLE> (<YEAR>)"
  file_format: "<ID><IF:MULTIPART>-pt<PART></IF>"
```

**更改在重启容器后生效**：
```bash
docker-compose restart
```

### 端口映射

要使用不同的端口，在 `.env` 中设置 `HOST_PORT`：

```bash
HOST_PORT=9090
```

或直接编辑 `docker-compose.yml`：

```yaml
ports:
  - "9090:8080"  # 访问 http://localhost:9090
```

---

## 开发模式

用于带热重载的前端开发：

```bash
# 启动开发容器
docker-compose --profile dev up

# 对 web/frontend/ 的更改将触发热重载
```

这将前端源码目录挂载到容器中以进行实时开发。

---

## 故障排除

### 容器无法启动

检查日志：
```bash
docker-compose logs
```

常见问题：
- **端口 8080 被占用**：在 `.env` 文件中设置 `HOST_PORT=9090`
- **权限被拒绝**：确保 `./data` 目录可写，并检查 `.env` 中的 `PUID`/`PGID`（或旧版 `USER_ID`/`GROUP_ID`）
- **卷挂载失败**：检查 `.env` 中的 `MEDIA_PATH` 是否指向一个存在的目录

### 健康检查失败

健康检查端点是 `/health`。手动测试：
```bash
curl http://localhost:8080/health
```

### 数据库锁定

如果 SQLite 数据库被锁定：
```bash
# 停止容器
docker-compose down

# 删除锁文件
rm ./data/javinizer.db-shm ./data/javinizer.db-wal

# 重启
docker-compose up -d
```

### 查看容器内部

```bash
# 进入运行中的容器
docker-compose exec javinizer sh

# 检查二进制版本
javinizer --version

# 检查文件权限
ls -la /javinizer

# 检查运行中的进程
ps aux
```

### 重置应用状态

要重新开始（⚠️ **删除所有缓存的元数据**）：
```bash
# 停止容器
docker-compose down

# 删除应用状态
rm -rf ./data

# 重启（将创建全新的状态）
docker-compose up -d
```

---

## Docker 命令参考

### 镜像管理

```bash
# 列出镜像
docker images javinizer

# 删除旧镜像
docker rmi javinizer:old-tag

# 清理未使用的镜像
docker image prune
```

### 容器管理

```bash
# 列出运行中的容器
docker ps

# 查看容器资源使用
docker stats javinizer

# 查看容器文件系统更改
docker diff javinizer

# 导出容器文件系统
docker export javinizer > javinizer-backup.tar
```

### 日志和调试

```bash
# 实时跟踪日志
docker-compose logs -f --tail=100

# 查看特定时间段的日志
docker-compose logs --since 30m

# 查看资源使用
docker-compose stats

# 检查容器
docker inspect javinizer
```

---

## 安全考虑

### 以非 root 用户运行

容器以用户 `javinizer` 运行以确保安全。默认情况下，用户以 UID 1000 和 GID 1000 创建，但可以自定义以匹配你的主机用户。

**推荐方法**：使用 `.env` 文件（参见[使用 .env 文件配置](#使用-env-文件配置)）：
```bash
# 在 .env 文件中：
PUID=1000      # 获取：id -u
PGID=1000      # 获取：id -g
```

**替代方案**：通过命令行设置：
```bash
PUID=$(id -u) PGID=$(id -g) docker-compose up -d
```

**为什么这很重要**：将容器 UID/GID 与主机用户匹配可防止容器写入挂载卷（`./data` 和 `/media`）时出现权限问题。没有这个设置，你可能会看到 "permission denied" 错误或文件由错误的用户拥有。

### 网络安全

默认配置绑定到 `0.0.0.0:8080`（所有接口）。对于生产环境：

1. **使用反向代理**（nginx、Caddy）配合 HTTPS
2. **限制绑定**到 localhost：
   ```yaml
   ports:
     - "127.0.0.1:8080:8080"
   ```
3. **在 Web UI 中完成首次身份验证设置**（内置单用户身份验证）

   在 Docker 中，主机通过桥接网关连接，从容器视角来看这不是 localhost。
   在 `.env` 中设置 `JAVINIZER_SETUP_TRUSTED_CIDRS`（默认 `172.16.0.0/12`），使 `/auth/setup` 端点接受请求，
   或设置 `JAVINIZER_SETUP_SECRET` 并将其作为 `X-Setup-Secret` 头发送。参见[可用变量](#可用变量)。

---

## 生产部署

### 推荐配置

```yaml
services:
  javinizer:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - USER_ID=${PUID:-${USER_ID:-1000}}   # 匹配主机用户以确保权限
        - GROUP_ID=${PGID:-${GROUP_ID:-1000}}
    image: javinizer:latest
    container_name: javinizer
    restart: unless-stopped

    ports:
      - "127.0.0.1:8080:8080"  # 仅 localhost

    volumes:
      - ./data:/javinizer
      - /mnt/media/jav:/media  # 组织操作需要读写

    environment:
      - TZ=UTC
      - LOG_LEVEL=info  # 减少日志详细程度（覆盖 config.yaml）

    healthcheck:
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
```

**用法**：
```bash
# 设置用户/组以匹配你的主机用户
PUID=$(id -u) PGID=$(id -g) docker-compose up -d
```

---

## 部署目标

Javinizer 支持多种部署方式：

### Docker（推荐）

Docker 部署是大多数用户的推荐方式。优势：
- 隔离环境，包含所有依赖
- 跨平台行为一致
- 易于设置和拆除
- 持久数据的卷管理
- 内置健康检查

**Docker Compose** 是本指南中记录的主要部署方式。

### 独立二进制

Javinizer 也可以在没有 Docker 的情况下作为独立二进制运行。预构建二进制可用于：
- **Linux**：`amd64`、`arm64`
- **macOS**：`amd64`、`arm64`（Apple Silicon）、`universal`
- **Windows**：`amd64`

从 [GitHub Releases](https://github.com/javinizer/javinizer-go/releases) 下载。

**优势**：
- 不需要 Docker 运行时
- 更低的资源开销
- 直接文件系统访问
- 更快的启动时间

**注意事项**：
- 需要手动依赖管理（SQLite 库）
- 用户必须手动管理权限
- 无自动健康检查
- 配置和数据库路径必须显式配置

独立二进制部署请参阅[入门指南](./01-getting-started.zh.md)。

---

## 构建流水线

Javinizer 使用 GitHub Actions 进行自动构建和发布。

### CI/CD 工作流

构建流水线定义在 `.github/workflows/cli-release.yml`：

**触发条件**：
- **标签推送**：推送匹配 `v*` 的标签时创建稳定发布（例如 `v1.2.3`）
- **计划任务**：每天 UTC 午夜构建夜间快照
- **手动**：通过工作流调度支持手动发布（stable、prerelease 或 snapshot）

**构建步骤**：

1. **准备发布元数据**：
   - 通过 `scripts/version.sh` 从 `git describe --tags` 解析版本
   - 生成构建元数据（版本、commit SHA、构建日期）
   - 验证版本格式并与跟踪版本匹配

2. **构建 Web 资源**：
   - 使用 Node.js 22 编译 SvelteKit 前端
   - 捆绑静态资源以嵌入二进制

3. **构建二进制**（并行任务）：
   - **Linux**：`amd64`、`arm64`（带交叉编译工具链）
   - **macOS**：`amd64`、`arm64` 和通用二进制（lipo 合并）
   - **Windows**：带 CGO 支持的 `amd64`

4. **构建 Docker 镜像**：
   - 多架构构建（`linux/amd64`、`linux/arm64`）
   - 推送到 GitHub Container Registry（`ghcr.io`）
   - 标签：版本特定、`latest`（稳定发布）、`nightly`（夜间构建）

5. **创建 GitHub Release**：
   - 上传所有二进制产物
   - 生成校验和（SHA256）
   - 从提交历史自动生成发布说明

### 测试工作流

测试工作流（`.github/workflows/test.yml`）在每次推送和拉取请求时运行：

**任务**：
- **单元测试和覆盖率**：运行 `go test ./...`，覆盖率报告到 Codecov
- **竞态检测器**：在启用竞态检测的情况下测试并发代码
- **代码检查和代码质量**：运行 `golangci-lint`、`go vet`、格式检查和内部 API 文件大小限制
- **漏洞扫描**：针对 Go 依赖图运行 `govulncheck`
- **单元测试 (Windows)**：在 Windows 上运行单元测试套件以捕获平台特定问题
- **前端测试**：为 SvelteKit 前端运行 Vitest 套件
- **构建验证**：编译二进制并验证嵌入的 Web UI
- **Docker 构建**：构建 Docker 镜像并验证元数据
- **全栈端到端测试**（`fullstack-e2e`）：运行真实浏览器 → SvelteKit → Go API → worker 流水线（`make test-e2e-fullstack`）

**覆盖率阈值**：强制执行最低 75% 行覆盖率（通过 `scripts/check_coverage.sh`）

### 发布类型

| 类型 | 触发条件 | 版本格式 | Latest 标签 | 预发布 |
|------|---------|----------------|------------|------------|
| Stable | 标签推送 `v*`（例如 `v1.2.3`）或手动调度 | `vX.Y.Z` | 是 | 否 |
| Prerelease | 手动调度 | `vX.Y.Z-rc.N`（例如 `v1.2.3-rc.1`） | 是 | 是 |
| Nightly | 计划任务（UTC 午夜） | `0.0.0-nightly.<7-char-commit>`（例如 `0.0.0-nightly.abc1234`） | 否 | 是 |
| Snapshot | 手动调度 | 用户提供（例如 `v1.2.3-snapshot.1`）；如果未提供版本，则生成 nightly | 否 | 是 |

---

## 回滚流程

如果部署遇到问题，可以恢复到之前的版本：

### Docker 回滚

1. **停止当前容器**：
   ```bash
   docker-compose down
   ```

2. **识别之前的镜像版本**：
   ```bash
   # 列出可用镜像
   docker images | grep javinizer
   
   # 或查看 GitHub Releases 中的先前版本
   # https://github.com/javinizer/javinizer-go/releases
   ```

3. **重新部署之前的版本**：
   ```bash
   # 选项 1：在 docker-compose.yml 中锁定特定版本标签
   # 将 `image:` 行编辑为所需版本，例如：
   #   image: ghcr.io/javinizer/javinizer-go:v1.2.3
   docker-compose pull
   docker-compose up -d
   
   # 选项 2：从之前的 Git 标签构建
   # 在 docker-compose.yml 中启用 `build:` 部分（注释掉 `image:`），然后：
   git checkout v1.2.3
   docker-compose build
   docker-compose up -d
   git checkout main  # 返回主分支
   ```

4. **验证回滚**：
   ```bash
   # 检查容器版本
   docker-compose exec javinizer javinizer --version
   
   # 验证 Web UI 是否可访问
   curl http://localhost:8080/health
   ```

### 独立二进制回滚

1. 从 [GitHub Releases](https://github.com/javinizer/javinizer-go/releases) 下载之前的二进制

2. **停止当前服务**：
   ```bash
   # 如果作为服务运行
   sudo systemctl stop javinizer
   
   # 或直接终止进程
   pkill javinizer
   ```

3. **替换二进制**：
   ```bash
   # 备份当前二进制
   cp /usr/local/bin/javinizer /usr/local/bin/javinizer.backup
   
   # 替换为之前的版本（发布资源是裸二进制文件，
   # 下载后立即可运行——在移动前只需使其可执行）。
   # 在 URL 中锁定特定标签，例如：
   #   curl -L -o javinizer-linux-amd64 https://github.com/javinizer/javinizer-go/releases/download/v1.2.3/javinizer-linux-amd64
   chmod +x javinizer-linux-amd64
   sudo mv javinizer-linux-amd64 /usr/local/bin/javinizer
   sudo chmod +x /usr/local/bin/javinizer
   ```

4. **重启服务**：
   ```bash
   sudo systemctl start javinizer
   ```

### 数据库兼容性

**注意**：数据库和配置文件通常在小版本间向后兼容。但：
- 大版本升级可能需要数据库迁移
- 回滚前始终备份 `./data/` 目录
- 查看发布说明了解破坏性变更

### 回滚决策矩阵

| 问题类型 | 回滚操作 | 替代方案 |
|------------|-----------------|-------------|
| 应用崩溃 | 回滚二进制/镜像 | 如果是简单 bug 则向前修复 |
| 数据库损坏 | 从备份恢复 | 导出/导入元数据 |
| 性能回归 | 回滚到之前版本 | 调整配置 |
| 安全漏洞 | 升级到已修补版本 | 应用变通配置 |

---

## 监控

Javinizer 目前不包含内置监控或可观测性集成（例如 Sentry、Datadog、Prometheus、OpenTelemetry）。

### 当前可观测性功能

**健康检查**：
- HTTP 端点：`/health`
- API 服务器运行时返回 `200 OK`
- 与 `docker-compose.yml` 中的 Docker 健康检查集成

**日志记录**：
- 结构化 JSON 日志输出到 stdout
- 可配置日志级别：`debug`、`info`、`warn`、`error`
- 通过 `logging.output` 配置的日志文件输出
- 可通过 `docker-compose logs` 访问容器日志

**指标**：
- 无内置指标收集
- 无 Prometheus 端点
- 无暴露的性能计数器

### 推荐的监控设置

对于生产部署，考虑添加外部监控：

**应用性能监控 (APM)**：
- 集成 Go APM 库（例如 OpenTelemetry、Datadog）进行跟踪
- 在关键函数（抓取器执行、数据库查询）中添加仪表化
- 将跟踪导出到可观测性平台

**日志聚合**：
- 将容器日志转发到集中式日志平台（ELK、Loki、CloudWatch）
- 使用日志转发代理（Promtail、Fluentd、Filebeat）
- 配置结构化日志以便更好解析

**正常运行时间监控**：
- 使用外部工具监控 `/health` 端点
- 设置服务不可用警报
- 考虑 Uptime Kuma、Pingdom 或云提供商的健康检查

**资源监控**：
- 使用 Docker stats：`docker stats javinizer`
- 监控容器资源使用（CPU、内存、磁盘 I/O）
- 设置异常使用模式的资源警报

**未来增强**：
监控功能可能会在未来版本中添加。在 GitHub 上跟踪带有 `monitoring` 或 `observability` 标签的问题以了解进展。

---

## 下一步

- [配置指南](./02-configuration.zh.md) - 详细的配置选项
- [CLI 用法](./03-cli-reference.zh.md) - 命令行界面参考
- [API 文档](http://localhost:8080/docs) - REST API 参考（运行时）

---

## 支持

- **Issues**：[GitHub Issues](https://github.com/javinizer/javinizer-go/issues)
- **Discussions**：[GitHub Discussions](https://github.com/javinizer/javinizer-go/discussions)