# 架构概述

Javinizer Go 是一个用 Go 编写的日本成人影片（JAV）元数据抓取器和文件组织器。该系统提供多种用户界面（CLI、TUI、REST API 和 Web UI），并通过一个流水线处理视频文件，该流水线提取 JAV ID、从多个来源抓取元数据、聚合结果、持久化到数据库，并根据可配置的模板组织文件。

## 系统概述

Javinizer Go 的核心是将一个未经组织的 JAV 视频文件库转换为结构化、元数据丰富的收藏集。系统接收视频文件作为输入，从文件名中提取 JAV 标识符，并发查询多个元数据抓取器，根据可配置的字段级优先级合并结果，下载相关媒体（封面、海报、预告片），为媒体中心生成 NFO 元数据文件，并使用基于模板的命名方案重新组织文件。

架构遵循分层设计，在接口（CLI/TUI/API）、编排（工作线程池）、业务逻辑（抓取、聚合、组织）和持久化（数据库）之间有清晰的分离。系统支持使用可配置的工作线程数和超时时间并发处理多个文件，实现大型库的高效批处理。

## 组件图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户界面                                     │
├───────────────┬──────────────────┬──────────────────┬───────────────┤
│      CLI      │       TUI        │    REST API      │    Web UI     │
│  (cobra cmds) │  (bubbletea TUI) │   (gin server)   │  (SvelteKit)  │
└───────┬───────┴────────┬─────────┴─────────┬────────┴───────────────┘
        │                │                   │
        └────────────────┴───────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      编排层                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │     Workflow 接缝 (internal/workflow) + BatchJobInterface    │  │
│  │     - Scrape / Apply / Rescrape 阶段                          │  │
│  │     - 每个阶段有界扇出工作线程池                                  │  │
│  │     - 进度报告和错误聚合                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       处理流水线                                     │
├───────────┬──────────┬──────────┬────────────┬──────────┬──────────┤
│  Scanner  │ Matcher  │ Scrapers │ Aggregator │Database  │Organizer │
│ (files)   │(JAV IDs) │(metadata)│  (merge)   │(persist) │ (rename) │
└─────┬─────┴────┬─────┴────┬─────┴─────┬──────┴────┬─────┴────┬─────┘
      │          │          │           │           │          │
      └──────────┴──────────┴───────────┴───────────┴──────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      支持服务                                        │
├──────────────┬──────────────┬─────────────┬────────────┬─────────────┤
│  Downloader  │     NFO      │  Template   │ Translation│   History   │
│   (media)    │  Generator   │   Engine    │  Service   │   Tracker   │
└──────────────┴──────────────┴─────────────┴────────────┴─────────────┘
```

## 数据流

典型的文件组织操作遵循以下流水线：

1. **文件发现** - `internal/scanner` 递归扫描输入目录，查找匹配配置的扩展名和大小阈值的视频文件。

2. **ID 提取** - `internal/matcher` 使用模式匹配从文件名中提取 JAV ID（例如 `IPX-123.mp4` → `IPX-123`）。还支持用于抓取器特定 URL 的直接 URL 输入。

3. **元数据抓取** - `internal/scraper` 按优先级顺序查询已启用的抓取器（r18dev、dmm、javlibrary 等）。每个抓取器返回包含元数据字段的 `ScraperResult`。失败时系统继续到下一个抓取器，记录错误但不停止流水线。

4. **结果聚合** - `internal/aggregator` 使用字段级优先级配置将多个 `ScraperResult` 对象合并为单个 `Movie` 模型。对于每个字段（标题、演员、类别等），聚合器从按优先级排序的结果中选择第一个非空值。类别替换和演员别名转换在聚合期间应用。

5. **翻译**（可选）- `internal/translation` 使用配置的提供商（DeepL、Google、OpenAI、OpenAI 兼容、Anthropic）将元数据字段（标题、描述、制作商等）翻译为目标语言。

6. **数据库持久化** - `internal/database` 将聚合后的 `Movie` 存储到 SQLite，包括演员、类别、翻译和截图。历史操作被跟踪以支持回滚功能。

7. **媒体下载** - `internal/downloader` 从抓取器提供的 URL 获取封面图片、海报、背景图、预告片和演员缩略图。下载遵循代理配置，并包含对瞬时故障的重试逻辑。

8. **文件组织** - `internal/organizer` 根据模板配置重命名和移动文件（例如 `<ID> [<MAKER>] - <TITLE> (<YEAR>)`）。支持干运行模式以预览更改。

9. **NFO 生成** - `internal/nfo` 使用抓取的信息创建 Kodi/Plex 兼容的 NFO 元数据文件。

10. **进度报告** - 在整个流水线中，工作流接缝和 `internal/worker` 阶段钩子跟踪任务/阶段状态，并通过 WebSocket 向连接的 UI 客户端广播更新。

## 关键抽象

### Scraper 接口 (`internal/models/scraper.go`)

`Scraper` 接口定义了所有元数据源的契约：

```go
type Scraper interface {
    Name() string                                              // 抓取器标识符（例如 "r18dev"）
    Search(ctx context.Context, id string) (*ScraperResult, error) // 按 JAV ID 抓取
    GetURL(ctx context.Context, id string) (string, error)     // 解析 ID 的 URL
    IsEnabled() bool                                           // 检查是否在配置中启用
    Config() *models.ScraperSettings                           // 抓取器特定配置
    Close() error                                              // 清理资源
}
```

可选接口扩展了抓取器能力。消费者通过类型断言检测它们（例如 `handler, ok := scraper.(URLHandler)`），而不是假设支持：
- `URLHandler` - 直接 URL 抓取：`CanHandleURL`、`ExtractIDFromURL` 和 `ScrapeURL(ctx, url)` 用于抓取器特定 URL
- `DownloadProxyResolver` - 为从抓取器特定 CDN 主机获取的媒体解析每个主机的下载代理配置
- `ScraperQueryResolver` - 声明和规范化抓取器可以处理的非标准标识符格式
- `ContentIDResolver` - 将 JAV ID 解析为其 DMM content-ID 格式（例如 `ipx-123` → `118BDP-00118`）
- `ContentIDResolverCtx` - `ContentIDResolver` 的上下文感知变体，用于需要发出 HTTP 请求的抓取器；调用者首先断言此接口，然后回退到 `ContentIDResolver`
- `HTMLParser` - 将预获取的 `goquery.Document` 解析为 `ScraperResult`，支持使用静态 HTML 夹具进行测试

**位置：** `internal/models/scraper.go:132-153`（核心接口）；可选接口在 `:159-226`

### Aggregator 接口 (`internal/aggregator/aggregator.go`)

`AggregatorInterface` 将多个抓取器结果合并为统一的 `Movie`：

```go
type AggregatorInterface interface {
    Aggregate(results []*models.ScraperResult) (*models.Movie, *AggregateResult, error)
    AggregateWithPriority(results []*models.ScraperResult, customPriority []string) (*models.Movie, *AggregateResult, error)
    ReloadReplacementCaches(ctx context.Context)
}
```

`AggregatorInterface` 暴露三个操作：`Aggregate` 运行默认优先级合并；`AggregateWithPriority` 在单次调用中覆盖抓取器顺序（用于每个任务的抓取器过滤器）；`ReloadReplacementCaches` 在变更后热重载类别、词语和别名替换映射，无需重建整个工作流工厂。`Aggregate` 返回 `*AggregateResult` 以及 `*models.Movie`——它携带 `FieldSources`（哪个抓取器填充了每个字段）和 `ResolvedPriorities`（实际使用的每个字段优先级列表），因此调用者无需检查聚合器内部状态。每个字段在配置时使用其每个字段的优先级列表——每个字段的列表是**排他的**（无全局回退）——否则回退到全局 `scrapers.priority` 列表，优先选择较早的抓取器以获取非空值。类别替换、词语替换、演员别名解析和演员合并委托给在 `New` 中组合的聚焦子处理器。

**位置：** `internal/aggregator/aggregator.go:20-32`

### Repository 接口 (`internal/database/interfaces.go`)

数据库操作通过仓库接口抽象以实现可测试性：

- `MovieRepositoryInterface` - 影片的 CRUD 和 upsert（包括翻译和截图）
- `ActressRepositoryInterface` - 演员管理和查找
- `GenreRepositoryInterface` - 类别目录管理
- `GenreTranslationRepositoryInterface` - 每种语言的类别翻译
- `ActressTranslationRepositoryInterface` - 每种语言的演员翻译
- `GenreReplacementRepositoryInterface` - 类别映射/替换规则
- `WordReplacementRepositoryInterface` - 词语映射/替换规则
- `HistoryRepositoryInterface` - 操作跟踪和回滚
- `ActressAliasRepositoryInterface` - 演员名称规范化/别名
- `MovieTagRepositoryInterface` - 自定义影片标签
- `ContentIDMappingRepositoryInterface` - 搜索 ID → content-ID 映射
- `JobRepositoryInterface` - 后台任务跟踪
- `BatchFileOperationRepositoryInterface` - 批量文件操作记录
- `ApiTokenRepositoryInterface` - API 令牌管理
- `EventRepositoryInterface` - 系统事件日志

影片语言翻译由内部 `movieTranslationRepository`（无公共接口）持久化，通过影片保存路径调用，因此此文件中没有 `MovieTranslationRepositoryInterface`。

**位置：** `internal/database/interfaces.go`

### Workflow 接缝和 BatchJobInterface (`internal/workflow`、`internal/worker`)

编排层是一个统一的 `Workflow` 抽象。临时任务类型（`ScrapeTask`/`DownloadTask`/`OrganizeTask`/`NFOTask`）已合并到此单一接缝上，工作线程池执行基于阶段的作业。

`workflow.WorkflowInterface` (`internal/workflow/interfaces.go`) 暴露调用者调用的接缝方法：

```go
type WorkflowInterface interface {
    Scrape(ctx context.Context, cmd scrape.ScrapeCmd, progress scrape.ProgressFunc) (*scrape.ScrapeResult, *OrchestrationMeta, error)
    Apply(ctx context.Context, cmd ApplyCmd, progress scrape.ProgressFunc) (*ApplyResult, error)
    Preview(...) (*PreviewResult, error)
    Compare(...) (*CompareResult, error)
    ScanAndMatch(...) (*ScanAndMatchResult, error)
}
```

`worker.BatchJobInterface` (`internal/worker/batch_job_interface.go`) 通过三个阶段驱动批处理作业——**scrape**、**apply** 和 **rescrape**——每个阶段具有有界扇出并发、进度报告和错误聚合。它组合了狭窄的子接口（`JobReader`、`MovieLookup`、`PhaseController`、`JobCanceller`、`JobEditor`），因此处理器依赖于它们所需的最窄视图。

启动时，`SetReconstructionDeps` 对从数据库加载的作业重新水化基础设施依赖，因此重启后的 apply/rescrape 和影片编辑持久化继续工作。

**位置：** `internal/workflow/interfaces.go`、`internal/worker/batch_job_interface.go`

## 目录结构

```
javinizer-go/
├── cmd/javinizer/          # CLI 入口点和命令定义
│   ├── main.go              # 引导和 Execute() 调用
│   ├── root.go              # 根 cobra 命令
│   └── commands/            # 子命令（sort、scrape、tui、api 等）
│       ├── sort/            # 文件组织命令
│       ├── scrape/          # 手动元数据抓取
│       ├── tui/             # 终端 UI 命令
│       ├── update/          # 重新抓取现有文件
│       └── init/            # 配置初始化
│
├── internal/                # 私有应用代码
│   ├── api/                 # REST API 服务器（Gin 框架）
│   │   ├── server/          # Gin 路由组合、中间件、文档/静态、OpenAPI 规范
│   │   ├── contracts/       # 线格式投影层（DTO、movie_view）
│   │   ├── core/            # 依赖容器、运行时状态、路径/安全辅助
│   │   ├── middleware/      # 共享 HTTP 中间件（任务 ID 验证、速率限制）
│   │   ├── apperrors/       # 类型化 API 错误映射和 HTTP 错误响应
│   │   ├── batch/           # 批量操作（organize、scrape、rescrape）
│   │   ├── movie/           # 影片 CRUD 端点
│   │   ├── actress/         # 演员管理端点（包括导出/导入）
│   │   ├── genre/           # 类别目录和类别/词语替换端点
│   │   ├── file/            # 文件系统浏览和目录扫描端点
│   │   ├── jobs/            # 后台任务、操作和回滚端点
│   │   ├── history/         # 历史和回滚端点
│   │   ├── events/          # 系统事件日志端点
│   │   ├── token/           # API 令牌管理端点
│   │   ├── version/         # 版本和更新检查端点
│   │   ├── realtime/        # WebSocket 进度流
│   │   ├── auth/            # 身份验证中间件
│   │   ├── system/          # 配置、抓取器信息、代理测试、翻译端点
│   │   ├── temp/            # 临时/裁剪海报和图片服务端点
│   │   └── testkit/         # API 测试辅助和模拟构建器
│   │
│   ├── aggregator/          # 多源元数据合并
│   │   └── aggregator.go    # 基于优先级的字段选择
│   │
│   ├── database/            # SQLite 持久化层
│   │   ├── interfaces.go    # 仓库接口
│   │   ├── db.go            # 数据库连接和迁移
│   │   └── [repositories]   # Movie、Actress、History 等
│   │
│   ├── downloader/          # 媒体文件下载
│   │   └── downloader.go    # 重试逻辑、代理支持
│   │
│   ├── matcher/             # 从文件名提取 JAV ID
│   │   ├── matcher.go       # 模式匹配逻辑
│   │   ├── multipart.go     # 多部分文件检测
│   │   └── url_parser.go    # 直接 URL 处理
│   │
│   ├── models/              # 数据模型和接口
│   │   ├── scraper.go       # Scraper 接口和注册表
│   │   ├── movie.go         # Movie、Actress、Genre 结构体
│   │   └── [model files]    # History、Config 等
│   │
│   ├── nfo/                 # NFO 元数据文件生成
│   │   └── generator.go     # Kodi/Plex NFO 格式
│   │
│   ├── organizer/           # 文件重命名和移动
│   │   ├── organizer.go     # 基于模板的组织
│   │   └── subtitles.go     # 字幕文件处理
│   │
│   ├── scanner/             # 文件系统扫描
│   │   └── scanner.go       # 递归目录扫描
│   │
│   ├── scraper/             # 元数据抓取器
│   │   ├── registry.go      # 抓取器注册
│   │   ├── dmm/             # DMM/Fanza 抓取器
│   │   ├── r18dev/          # R18.dev JSON API 抓取器
│   │   ├── javlibrary/      # JavLibrary 抓取器
│   │   ├── javdb/           # JavDB 抓取器
│   │   ├── javbus/          # JavBus 抓取器
│   │   ├── mgstage/         # MGS Stage 抓取器
│   │   ├── fc2/             # FC2 抓取器
│   │   └── [更多抓取器]      # 其他来源
│   │
│   ├── scraperutil/         # 抓取器工具
│   │   ├── scraper_registry.go   # 集中式抓取器注册表（注册目录）
│   │   └── registration_catalog.go # 抓取器配置和初始化
│   │
│   ├── template/            # 输出命名的模板引擎
│   │   └── engine.go        # <ID>、<TITLE>、<MAKER> 等
│   │
│   ├── translation/         # 元数据翻译服务
│   │   └── service.go       # OpenAI、DeepL、Google、OpenAI 兼容、Anthropic
│   │
│   ├── tui/                 # 终端 UI（Bubble Tea）
│   │   ├── model.go         # 应用状态
│   │   ├── views/           # UI 组件
│   │   └── interfaces.go    # 池和进度抽象
│   │
│   ├── worker/              # 基于阶段的批处理作业执行
│   │   ├── batch_job_interface.go # BatchJobInterface（scrape/apply/rescrape 阶段）
│   │   ├── scrape_phase.go  # Scrape 阶段
│   │   ├── apply_phase.go   # Apply（organize/NFO/download）阶段
│   │   ├── rescrape_phase.go # Rescrape 阶段
│   │   ├── job_store.go     # 内存任务存储和重建
│   │   └── progress_fn.go   # 进度报告和 WebSocket 广播
│   │
│   ├── workflow/            # Workflow 接缝（统一编排抽象）
│   │   ├── interfaces.go    # WorkflowInterface（Scrape/Apply/Preview/Compare/ScanAndMatch）
│   │   ├── factory.go       # 依赖接线/工厂边界
│   │   └── [orchestrators]  # scrape/apply/compare/preview/scanmatch 编排器
│   │
│   ├── config/              # 配置加载和验证
│   ├── httpclient/          # 带代理支持的 HTTP 客户端工厂
│   ├── logging/             # 结构化日志
│   └── testutil/            # 测试辅助和构建器
│
├── web/frontend/            # Web UI（SvelteKit）
│   └── src/                 # 前端源码
│       ├── routes/          # SvelteKit 页面
│       ├── lib/components/  # 可重用 UI 组件
│       └── lib/stores/      # Svelte 存储（状态管理）
│
├── docs/                    # 文档
├── configs/                 # 示例配置文件
├── scripts/                 # 构建和发布脚本
└── testdata/                # 测试夹具
```

**设计理由：**

- **`cmd/` 与 `internal/`** - 入口点和命令接线在 `cmd/` 中公开，而所有业务逻辑保留在 `internal/` 中以防止外部依赖。
- **`internal/api/` 组织** - API 端点按领域分组（movie、actress、batch、history），而不是按 HTTP 方法，使得更容易理解每个资源的能力。
- **`internal/scraper/` 结构** - 每个抓取器是一个子包，有自己的实现，允许独立测试和配置，同时在 `internal/scraperutil/` 中共享工具。
- **`internal/worker/` + `internal/workflow/` 分离** - `workflow` 接缝拥有 scrape/apply/rescrape 编排；`worker` 提供基于阶段的 `BatchJobInterface` 和有界扇出执行。两者都不了解 UI 关注点，使它们保持可重用和可独立测试。
- **`web/frontend/` 分离** - SvelteKit 前端是一个独立项目，仅通过 REST API 和 WebSocket 通信，支持独立开发和开发期间的热重载。