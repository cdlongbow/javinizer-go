# 开发指南

参与和开发 Javinizer Go 的指南。

## 项目结构

```
javinizer-go/
├── cmd/
│   ├── coveragecheck/ # 覆盖率阈值检查 CLI
│   ├── javinizer/     # CLI + API 入口点
│   └── javinizer-e2e/ # 端到端测试二进制
├── internal/
│   ├── aggregator/      # 元数据聚合
│   ├── api/             # API 服务器、处理器和领域包
│   ├── challengedetect/ # Cloudflare 挑战检测
│   ├── commandutil/     # Cobra 命令和依赖注入辅助
│   ├── config/          # 配置管理
│   ├── coverage/        # 覆盖率报告辅助
│   ├── database/        # 数据库层 (GORM)
│   ├── downloader/      # 媒体下载
│   ├── enumutil/        # 通用字符串枚举辅助
│   ├── eventlog/        # 结构化事件日志输出和统计
│   ├── formatter/       # 影片元数据格式化
│   ├── fsutil/          # 文件系统辅助 (afero)
│   ├── history/         # 历史记录跟踪
│   ├── httpclient/      # HTTP 客户端 + FlareSolverr 支持
│   ├── imageutil/       # 图片工具
│   ├── logging/         # 日志
│   ├── matcher/         # 文件/ID 匹配
│   ├── mediainfo/       # MediaInfo 提取
│   ├── mocks/           # 生成的 mockery 模拟（请勿编辑）
│   ├── models/          # 数据模型
│   ├── nfo/             # NFO 生成
│   ├── operationmode/   # OperationMode 类型 (CLI/API/TUI)
│   ├── organizer/       # 文件组织
│   ├── panicutil/       # 共享的 panic 恢复工具
│   ├── poster/          # 海报图片生成和管理
│   ├── ratelimit/       # 速率限制
│   ├── scanner/         # 文件扫描
│   ├── scrape/          # 抓取编排（缓存、来源、翻译）
│   ├── scraper/         # 抓取器实现和注册
│   ├── scraperconfig/   # 抓取器配置类型
│   ├── scraperutil/     # 抓取器注册表和共享工具
│   ├── ssrf/            # SSRF 防护 / URL 验证
│   ├── template/        # 模板引擎
│   ├── testutil/        # 共享测试工具
│   ├── translation/     # 翻译服务
│   ├── tui/             # 终端 UI
│   ├── update/          # 自更新检查和服务
│   ├── version/         # 版本元数据
│   ├── websocket/       # WebSocket 中心
│   ├── worker/          # 并发工作者
│   └── workflow/        # 排序/应用/比较工作流编排
├── web/
│   ├── frontend/ # SvelteKit 前端源码 (npm / Vite)
│   ├── dist/     # 嵌入的 Web 捆绑包（由 `make web-build` 构建）
│   └── embed.go  # 通过 go:embed 将 dist/ 嵌入到二进制中
├── configs/              # 默认配置 (config.yaml.example)
├── data/                 # 运行时数据
├── docs/                 # 文档
└── scripts/              # 开发/CI 辅助脚本
```

## 开发环境设置

### 前置条件

- Go 1.26+
- Git
- SQLite3（用于数据库检查）

### 设置

```bash
# 克隆仓库
git clone https://github.com/javinizer/javinizer-go.git
cd javinizer-go

# 安装依赖
go mod download

# 构建
go build -o bin/javinizer ./cmd/javinizer

# 运行
./bin/javinizer --help
```

### 运行测试

```bash
# 所有测试
go test ./...

# 带覆盖率
go test ./... -cover

# 特定包
go test ./internal/matcher

# 详细输出
go test ./... -v
```

## 添加新的抓取器

抓取器实现 `models.Scraper` 接口（`internal/models/scraper.go`），并通过 `scraperutil.ScraperRegistration` 注册为元数据。注册表本身是 `scraperutil.NewScraperRegistry()`（位于 `internal/scraperutil`）；每个抓取器包暴露一个 `Register(reg scraperutil.ScraperRegistrar)` 函数，`internal/scraper/registration.go` 通过 `RegisterAll` 将所有包接入注册表。每个抓取器的用户设置在配置中位于 `scrapers.<name>` 下，并在启动时解析为 `cfg.Scrapers.Overrides[<name>]`（`*models.ScraperSettings`）。

### 1. 实现 Scraper 接口

该接口需要六个方法。注意 `Search` 和 `GetURL` 接受 `context.Context`（用于通过速率限制器和 HTTP 客户端实现取消/超时），`GetURL` 返回错误，`Config()`/`Close()` 是必需的：

```go
// internal/scraper/newscraper/newscraper.go
package newscraper

import (
    "context"
    "fmt"
    "net/http"
    "time"

    "github.com/javinizer/javinizer-go/internal/models"
    "github.com/javinizer/javinizer-go/internal/scraperconfig"
)

type Scraper struct {
    settings *scraperconfig.ScraperSettings
    client   *http.Client
}

func newScraper(settings *scraperconfig.ScraperSettings) *Scraper {
    return &Scraper{
        settings: settings,
        client:   &http.Client{Timeout: 30 * time.Second},
    }
}

func (s *Scraper) Name() string                          { return "newscraper" }
func (s *Scraper) IsEnabled() bool                       { return s.settings != nil && s.settings.Enabled }
func (s *Scraper) Config() *scraperconfig.ScraperSettings { return s.settings }
func (s *Scraper) Close() error                          { return nil }

func (s *Scraper) Search(ctx context.Context, id string) (*models.ScraperResult, error) {
    // 实现抓取逻辑，尊重 ctx 的取消/超时
    return &models.ScraperResult{
        Source: "newscraper",
        ID:     id,
        Title:  "...",
        // ... 其他字段
    }, nil
}

func (s *Scraper) GetURL(ctx context.Context, id string) (string, error) {
    return fmt.Sprintf("https://newscraper.com/movie/%s", id), nil
}
```

### 2. 注册抓取器

在包中添加 `module.go`，注册一个 `ScraperRegistration`（构造函数、默认值、优先级和可选的选项/验证器）。构造函数接收类型化的 `scraperutil.ScraperDeps` 并返回 `models.Scraper` 实例——在启动时使用解析后的每个抓取器设置调用：

```go
// internal/scraper/newscraper/module.go
package newscraper

import (
    "github.com/javinizer/javinizer-go/internal/config"
    "github.com/javinizer/javinizer-go/internal/models"
    "github.com/javinizer/javinizer-go/internal/scraperutil"
)

func Register(reg scraperutil.ScraperRegistrar) {
    reg.Register(scraperutil.ScraperRegistration{
        Name:        "newscraper",
        Description: "New Scraper",
        Priority:    50,
        Defaults: models.ScraperSettings{
            Enabled:   true,
            Language:  "en",
            UserAgent: config.DefaultUserAgent,
        },
        Constructor: func(deps scraperutil.ScraperDeps) (models.Scraper, error) {
            return newScraper(&deps.Settings), nil
        },
    })
}
```

### 3. 接入 RegisterAll

最后，从 `internal/scraper/registration.go` 调用你的 `Register`，这是枚举所有已提供抓取器的唯一位置：

```go
// internal/scraper/registration.go
func RegisterAll(reg scraperutil.ScraperRegistrar) {
    r18dev.Register(reg)
    dmm.Register(reg)
    // ...其他抓取器...
    newscraper.Register(reg) // 在此添加
}
```

## 构建和发布

### 为当前平台构建

```bash
# 仅构建 CLI（无前端）
go build -o bin/javinizer ./cmd/javinizer

# 构建单一二进制（API + 嵌入的 Web UI）——需要前端捆绑包
make build
```

`make build` 依赖于 `make web-build`（它嵌入 `web/dist`），因此必须首先构建前端。运行 `make web-build` 一次（或让 `build` 目标自动执行），否则嵌入的 UI 会回退到占位资源。

### 交叉编译

对于一次性本地构建，可以直接设置 `GOOS`/`GOARCH`：

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o bin/javinizer-linux-amd64 ./cmd/javinizer

# macOS (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o bin/javinizer-darwin-arm64 ./cmd/javinizer

# Windows
GOOS=windows GOARCH=amd64 go build -o bin/javinizer-windows-amd64.exe ./cmd/javinizer
```

对于发布产物，优先使用 Makefile 目标，它们会嵌入 Web 捆绑包（`CGO_ENABLED=1` 配合发布 LDFLAGS）并生成通用 macOS 二进制：

```bash
make build-cli-linux    # bin/javinizer-linux-amd64
make build-cli-darwin   # bin/javinizer-darwin-universal（通过 lipo 合并 amd64 + arm64）
make build-cli-windows  # bin/javinizer-windows-amd64.exe
make build-cli-all      # 以上全部
```

### 发布工作流 (GitHub Actions)

发布自动化由 `.github/workflows/cli-release.yml` 处理。

1. 推送语义化版本标签以触发发布构建：
   - 稳定版：`vX.Y.Z`
   - 预发布版：`vX.Y.Z-alpha`、`vX.Y.Z-beta`、`vX.Y.Z-rc.1` 等。
2. 工作流构建产物并发布 GitHub Release 资源。

手动触发（`workflow_dispatch`）也支持 snapshot/stable/prerelease 运行。

### 每日构建

- 每日构建计划在 `00:00 UTC` 运行。
- 如果前 24 小时内未检测到影响发布的变更，则跳过每日构建。
- 每日构建仅发布 Docker 镜像（不发布 GitHub Release 资源）。

### Docker 标签规则

发布的标签由发布类型决定：

- 版本标签：始终发布（例如 `v0.1.1`、`v0.1.1-alpha`、`0.0.0-nightly.<sha7>`）
- `latest`：为版本化发布构建发布
- 仅稳定版别名：`v<major>`、`v<major>.<minor>`
- 每日构建别名：`nightly` 和 `nightly-<full-sha>`

### CI 质量门禁

CI 定义在 `.github/workflows/test.yml` 中，在每次推送和拉取请求时并行运行 9 个任务。本地质量门禁 `make ci` 镜像了 Go 侧的检查：`vet`、`lint`、`vuln`、`coverage-check`、`test-race`、`config-drift`、`check-import-guard` 和 `check-mocks`。运行 `make ci-full` 也会执行前端套件（`make web-test`），或运行 `make simulate-ci` 在本地重放 GitHub Actions 任务。

主要 CI 检查包括：

- 单元/集成测试（Linux + Windows）
- 覆盖率阈值强制执行（75% 行覆盖率）
- 竞态检测器测试（`internal/worker`、`internal/tui`、`internal/websocket`、`internal/api`）
- 代码检查和静态分析（go vet、golangci-lint v2.9.0、gofmt）
- 漏洞扫描（govulncheck）
- 前端测试（Vitest）
- 构建和 Docker 验证

### 内部 API 结构

关于 `internal/api` 的文件组织约定和大小限制，请参阅：

- [内部 API 组织](./15-internal-api-organization.zh.md)

## 代码风格

### 代码检查和格式化工具

项目使用以下工具保证代码质量：

- **gofmt** - 标准 Go 格式化工具
  - 配置：内置 Go 格式规则
  - 运行：`make fmt` 或 `gofmt -w .`
  - CI：在 `.github/workflows/test.yml` 中检查

- **go vet** - 可疑构造的静态分析
  - 配置：内置 Go vet 规则
  - 运行：`make vet` 或 `go vet ./...`
  - CI：必须在 CI 流水线中通过

- **golangci-lint** - 综合代码检查套件 (v2.9.0+)
  - 配置：`.golangci.yml`
  - 运行：`make lint` 或 `golangci-lint run`
  - CI：必须通过（在 `.github/workflows/test.yml` 中锁定为 v2.9.0）

### 运行命令

```bash
# 格式化所有代码
make fmt

# 运行静态分析
make vet

# 运行综合代码检查
make lint

# 运行所有质量检查
make ci
```

### Go 代码风格指南

**导入：** 使用空行分隔标准库、外部和内部包：
```go
import (
    "context"
    "fmt"
    
    "github.com/gin-gonic/gin"
    "gopkg.in/yaml.v3"
    
    "github.com/javinizer/javinizer-go/internal/config"
)
```

**命名约定：**
- 文件：`lowercase.go`，测试文件：`package_test.go`
- 公开标识符：`PascalCase`
- 私有标识符：`camelCase`
- 接口：`PascalCase` + `Interface` 后缀（例如 `MovieRepositoryInterface`）
- 常量：导出用 `PascalCase`，私有用 `camelCase`

**错误处理：** 始终使用上下文包装错误：
```go
if err != nil {
    return fmt.Errorf("failed to load config: %w", err)
}
```

**函数签名：** Context 放在第一位，可选参数使用 Options 模式：
```go
func ProcessFile(ctx context.Context, path string, opts *Options) error

type Options struct {
    Timeout time.Duration
    Retry   int
}
```

### CI 强制执行

所有代码风格检查在 CI 中强制执行：
- **格式化检查** - `gofmt -l .` 必须无输出
- **Vet 检查** - `go vet ./...` 必须通过
- **Lint 检查** - `golangci-lint run` 必须通过
- 如果任何检查失败，拉取请求将失败

## 分支约定

### 主分支

默认分支是 `main`（不是 `master`）。所有拉取请求应针对 `main`。

### 分支命名模式

使用描述性分支名称，并带有以下前缀：

- `feat/` - 新功能（例如 `feat/add-merge-ui-for-duplicate`）
- `fix/` - 错误修复（例如 `fix/scraper-timeout`）
- `refactor/` - 代码重构（例如 `refactor/cli-structure`）
- `test/` - 测试改进（例如 `test/improve-coverage-to-75`）
- `docs/` - 文档更新（例如 `docs/api-reference`）

### 提交信息格式

使用约定式提交格式：

```
<type>: <description>
```

类型：
- `feat:` - 新功能
- `fix:` - 错误修复
- `test:` - 测试增删改
- `docs:` - 文档变更
- `refactor:` - 代码重构
- `style:` - 格式化，无逻辑变更
- `chore:` - 维护任务

带可选范围：
```
feat(scraper): add support for new site
fix(batch): resolve race condition in job processing
```

## PR 流程

### 拉取请求要求

1. **分支命名** - 使用适当的前缀（`feat/`、`fix/`、`refactor/`、`test/`）
2. **提交信息** - 遵循约定式提交格式
3. **代码质量** - 所有 CI 检查必须通过：
   - 单元测试通过（`go test ./...`）
   - 达到覆盖率阈值（75% 行覆盖率）
   - 并发代码的竞态检测器测试通过
   - 代码检查通过（`make lint`）
   - 构建成功（`make build`）
   - Swagger 文档是最新的
   - Mockery 模拟是最新的

### CI 流水线

所有拉取请求触发以下 CI 任务（`.github/workflows/test.yml`），它们并行运行：

- **单元测试和覆盖率** (`test`) - 运行所有 Go 测试并强制执行 75% 行覆盖率阈值
- **竞态检测器测试** (`race-tests`) - 在 `internal/worker`、`internal/tui`、`internal/websocket` 和 `internal/api` 上运行竞态检测器
- **代码检查和代码质量** (`lint`) - 运行 go vet、golangci-lint (v2.9.0)、gofmt 检查和 `internal/api` 文件大小限制检查
- **漏洞扫描** (`vuln`) - 运行 `govulncheck ./...`
- **单元测试 (Windows)** (`test-windows`) - 在 Windows 上运行 Go 测试套件
- **前端测试** (`frontend-tests`) - 运行 Vitest 套件（`npm run test --prefix web/frontend`）
- **构建验证** (`build`) - 构建 CLI、生成并验证 Swagger 文档、验证 mockery 模拟是最新的、验证嵌入的 Web UI
- **Docker 构建验证** (`docker-build`) - 构建 Docker 镜像并验证镜像元数据
- **全栈端到端测试** (`fullstack-e2e`) - 运行 Playwright 全栈 E2E 套件（`make test-e2e-fullstack`）

### 提交前检查清单

在提交 PR 之前，在本地运行：

```bash
# 快速检查
make test-short

# 完整本地 CI
make ci

# 或模拟精确的 GitHub Actions
make simulate-ci
```

### 拉取请求工作流

1. Fork 仓库（如果没有写入权限）
2. 使用适当的前缀创建功能分支
3. 按照代码风格指南进行修改
4. 在本地运行测试：`make test`
5. 使用约定式提交信息提交
6. Push 到你的 fork
7. 向 `main` 发起拉取请求
8. 等待 CI 检查通过
9. 处理审查反馈

### 合并后

- PR 通过 squash 合并以保持历史整洁
- 合并后自动删除分支
- 变更将包含在下一次发布中

## 贡献

### 工作流

1. Fork 仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 进行修改
4. 运行测试：`go test ./...`
5. 提交：`git commit -m "Add my feature"`
6. Push：`git push origin feature/my-feature`
7. 创建拉取请求

## 资源

- **Go 文档**：https://go.dev/doc/
- **GORM 文档**：https://gorm.io/docs/
- **Cobra 文档**：https://github.com/spf13/cobra
- **原始 Javinizer**：https://github.com/jvlflame/Javinizer

---

**下一篇**：[故障排除](./10-troubleshooting.zh.md)