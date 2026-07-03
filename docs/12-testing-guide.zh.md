# 测试指南

本指南涵盖了 javinizer-go 项目的测试实践、工具和覆盖率要求。

## 目录

- [运行测试](#运行测试)
- [覆盖率要求](#覆盖率要求)
- [测试类型](#测试类型)
- [编写测试](#编写测试)
- [CI/CD 集成](#cicd-集成)
- [预提交钩子](#预提交钩子)
- [故障排除](#故障排除)

## 运行测试

### 快速开始

```bash
# 运行所有测试
make test

# 运行测试并生成覆盖率报告
make coverage

# 在浏览器中查看覆盖率
make coverage-html

# 检查 Codecov 兼容的行覆盖率是否达到阈值（75%）
make coverage-check
```

### 开发工具

本项目使用标准 Go 工具进行测试和覆盖率检查。

### 所有测试命令

| 命令 | 描述 | 使用场景 |
|---------|-------------|-------------|
| `make test` | 运行所有测试，详细输出 | 默认测试命令 |
| `make test-short` | 仅运行快速测试（跳过慢速集成测试） | 快速验证，提交前 |
| `make test-race` | 在并发包上运行竞态检测器 | 提交并发代码变更前 |
| `make test-verbose` | 运行测试，详细输出且不缓存 | 调试测试失败 |
| `make bench` | 运行基准测试 | 性能测试 |
| `make coverage` | 生成 coverage.out 文件 | CI/发布质量的覆盖率 |
| `make coverage-html` | 在浏览器中打开 HTML 覆盖率报告 | 可视化覆盖率分析 |
| `make coverage-pkg` | 按包显示覆盖率细分 | 识别特定缺口 |
| `make coverage-check` | 验证 Codecov 兼容的行覆盖率是否达到 75% 阈值 | 推送前验证 |
| `make ci` | 在本地运行完整 CI 套件（vet、lint、vuln、coverage-check、test-race、config-drift、check-import-guard、check-mocks） | 发起 PR 前 |

### 运行特定包的测试

```bash
# 测试特定包
go test ./internal/worker/...

# 带竞态检测器测试
go test -race ./internal/worker/...

# 测试特定函数
go test -v -run TestPool_Submit ./internal/worker

# 为单个包生成覆盖率
go test -coverprofile=coverage.out ./internal/matcher/...
go tool cover -html=coverage.out
```

## 覆盖率要求

### 项目整体覆盖率

- **当前基线：** 75% Codecov 兼容的行覆盖率（在 CI 中强制执行）
- **短期目标：** 80%
- **长期目标：** 80%+

### 各包覆盖率预期

| 包类别 | 目标覆盖率 | 理由 |
|------------------|----------------|-----------|
| **关键包** | 85%+ | 核心业务逻辑，数据完整性 |
| - `internal/worker` | 85% | 并发任务执行，对可靠性至关重要 |
| - `internal/aggregator` | 85% | 元数据合并逻辑 |
| - `internal/matcher` | 90% | JAV ID 提取 |
| - `internal/organizer` | 85% | 文件组织，数据安全 |
| - `internal/scanner` | 85% | 文件发现 |
| **重要包** | 70%+ | 面向用户的功能 |
| - `internal/scraper/*` | 70% | 外部数据获取 |
| - `internal/nfo` | 75% | NFO 生成 |
| - `internal/downloader` | 75% | 资源下载 |
| **辅助包** | 50%+ | 配置、模型、工具 |
| - `internal/config` | 50% | 简单的结构体初始化 |
| - `internal/models` | 50% | 数据结构 |
| - `internal/template` | 60% | 模板渲染 |
| **最低可接受覆盖率** | 30%+ | UI、CLI，优先手动测试 |
| - `internal/tui` | 30% | Bubble Tea UI（测试复杂） |
| - `cmd/javinizer/commands/*` | 40% | CLI 命令处理器（优先集成测试） |
| - `internal/api` | 60% | API 处理器 |

### 需要解决的覆盖率缺口

**高优先级**（需要加强的关键路径）：
1. `internal/worker` - 批量执行和错误分类分支
2. `internal/api` - 请求验证和边界情况响应
3. `cmd/javinizer/commands/*` - 命令参数/标志行为
4. `internal/scraper/*` - 网络故障和解析器回退路径

**中优先级**：
5. `internal/database` - 持久化和迁移边界情况
6. `internal/mediainfo` - 格式错误输入处理
7. `internal/translation` - 提供商回退/错误分支

## 测试类型

### 单元测试

快速、隔离的单个函数/方法测试。

```go
func TestMatchID(t *testing.T) {
    matcher := NewMatcher(config)
    id := matcher.ExtractID("ABC-123.mp4")
    assert.Equal(t, "ABC-123", id)
}
```

**指南：**
- 每个测试应在 <1 秒内完成
- 无外部依赖（文件系统、网络、数据库）
- 对多个场景使用表格驱动测试
- 使用 `if testing.Short() { t.Skip() }` 标记慢速测试，以便配合 `make test-short` 使用

### 集成测试

测试组件之间或与外部资源的交互。

```go
func TestNFOGeneration(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test in short mode")
    }
    // 使用真实配置文件和真实模板测试
}
```

**指南：**
- 放置在 `*_integration_test.go` 文件中或使用构建标签
- 使用 `testing.Short()` 允许通过 `-short` 标志跳过
- 在测试清理中释放资源（文件、数据库条目）

### 竞态检测器测试

对并发代码（工作线程池、TUI、WebSocket、API）至关重要。

```bash
# 在并发包上运行竞态检测器
make test-race

# 或手动：
go test -race ./internal/worker/...
```

**何时运行：**
- 提交对 `internal/worker`、`internal/tui`、`internal/websocket`、`internal/api` 的变更前
- 调试并发问题时
- 在 CI 中（每次 PR 自动运行）

**注意：** 竞态检测器测试较慢；它们在单独的 CI 任务中运行。

## 编写测试

### 测试文件组织

- 测试文件：`*_test.go` 位于同一包目录中
- 集成测试：`*_integration_test.go` 或单独的 `integration/` 子目录
- 测试数据：`testdata/` 子目录（约定，根据需要加入 gitignore）

### 测试模式

#### 表格驱动测试

推荐用于测试多个场景：

```go
func TestExtractID(t *testing.T) {
    tests := []struct {
        name     string
        filename string
        expected string
    }{
        {"Standard format", "ABC-123.mp4", "ABC-123"},
        {"With path", "/videos/ABC-123.mp4", "ABC-123"},
        {"No ID", "random.mp4", ""},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := ExtractID(tt.filename)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

#### 模拟 HTTP 客户端

用于抓取器测试（当前缺失）：

```go
type mockHTTPClient struct {
    response string
    err      error
}

func (m *mockHTTPClient) Get(url string) (*http.Response, error) {
    if m.err != nil {
        return nil, m.err
    }
    return &http.Response{
        Body: io.NopCloser(strings.NewReader(m.response)),
    }, nil
}

func TestDMMScraper(t *testing.T) {
    client := &mockHTTPClient{response: `<html>...</html>`}
    scraper := NewDMMScraper(client)
    // 测试抓取器逻辑，无需访问真实的 DMM 网站
}
```

#### 测试并发代码

使用 `t.Parallel()` 和适当的同步：

```go
func TestWorkerPool(t *testing.T) {
    pool := NewPool(5)

    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            task := NewMockTask(id)
            pool.Submit(task)
        }(i)
    }

    wg.Wait()
    // 验证结果
}
```

#### 测试 CLI 命令（Epic 6 模式）

测试 CLI 命令需要依赖注入，以避免全局状态并实现可测试性。该模式包括：

1. **导出 run 函数**，支持配置注入
2. **测试标志**（默认值、验证、互斥性）
3. **集成测试**，使用 `t.TempDir()` 在真实文件系统上测试
4. **单元测试**，测试提取的辅助函数

**来自 `cmd/javinizer/commands/update/command_test.go` 的完整示例：**

```go
// 标志测试
func TestFlags_DefaultValues(t *testing.T) {
    cmd := update.NewCommand()

    // 验证默认标志值
    assert.Equal(t, false, cmd.Flags().Lookup("dry-run").DefValue == "true")
    assert.Equal(t, "prefer-scraper", cmd.Flags().Lookup("scalar-strategy").DefValue)
}

func TestFlags_MutuallyExclusiveOptions(t *testing.T) {
    cmd := update.NewCommand()

    // 同时设置 --per-file 和 --interactive（应冲突）
    err := cmd.Flags().Set("per-file", "true")
    require.NoError(t, err)
    err = cmd.Flags().Set("interactive", "true")
    require.NoError(t, err)

    // RunE 应检测到冲突
    err = cmd.RunE(cmd, []string{})
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "cannot be used together")
}

// 文件系统集成测试
func TestRun_Integration_DryRunMode(t *testing.T) {
    if testing.Short() {
        t.Skip("integration test")
    }

    tmpDir := t.TempDir()
    configPath, _ := testutil.CreateTestConfig(t, nil)

    // 创建测试视频文件
    videoFile := filepath.Join(tmpDir, "IPX-123.mp4")
    require.NoError(t, os.WriteFile(videoFile, []byte("fake video"), 0644))

    cmd := update.NewCommand()
    cmd.Flags().Set("dry-run", "true")

    // 使用注入的配置进行测试
    err := update.Run(cmd, []string{tmpDir}, configPath)
    assert.NoError(t, err)
}

// 测试提取的辅助函数
func TestConstructNFOPath(t *testing.T) {
    tests := []struct {
        name         string
        id           string
        dir          string
        perFile      bool
        expectedPath string
    }{
        {
            name:         "per-file mode",
            id:           "IPX-123",
            dir:          "/videos",
            perFile:      true,
            expectedPath: "/videos/IPX-123.nfo",
        },
        {
            name:         "single NFO mode",
            id:           "IPX-456",
            dir:          "/videos",
            perFile:      false,
            expectedPath: "/videos/javinizer.nfo",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            match := matcher.MatchResult{
                ID:   tt.id,
                File: scanner.FileInfo{Dir: tt.dir},
            }
            movie := &models.Movie{ID: tt.id}

            result := update.ConstructNFOPath(match, movie, tt.perFile)
            assert.Equal(t, tt.expectedPath, result)
        })
    }
}
```

**CLI 命令测试的关键要求：**

- 导出 `run()` -> `Run()`，带配置文件参数以实现依赖注入
- 测试命令结构：标志、默认值、短形式、互斥性
- 在集成测试中使用 `t.TempDir()`（自动清理）
- 使用 `testutil.CreateTestConfig()` 生成测试配置
- 在短模式下跳过集成测试：`if testing.Short() { t.Skip() }`
- 测试成功和错误路径
- 测试更新现有元数据时的 NFO 合并逻辑

**导出模式示例：**

```go
// 之前（不可测试）：
func run(cmd *cobra.Command, args []string) error {
    cfg := viper.Get("config")  // 全局状态
    // ... 业务逻辑 ...
}

// 之后（可测试）：
func Run(cmd *cobra.Command, args []string, configFile string) error {
    cfg, err := config.Load(configFile)  // 注入的依赖
    if err != nil {
        return err
    }
    // ... 业务逻辑 ...
}
```

完整的测试套件请参阅 `cmd/javinizer/commands/update/command_test.go`，涵盖标志、集成场景和单元功能。

#### 测试 API 命令（Epic 7 模式）

对于启动长时间运行的服务器的命令（如 API 服务器），关键在于**将初始化与服务器启动分离**：

**模式：返回依赖项，不启动服务器**

```go
// 导出 Run 函数，返回初始化的依赖项
// cmd/javinizer/commands/api/command.go:66
func Run(cmd *cobra.Command, configFile string, hostFlag string, portFlag int) (*api.ServerDependencies, error) {
    // 所有初始化逻辑（配置、数据库、抓取器、仓库、聚合器、匹配器、任务队列）
    // ... ~80 行设置代码 ...

    // 返回依赖项，不启动阻塞的 HTTP 服务器
    return apiDeps, nil
}

// 私有 run 函数处理阻塞的服务器启动
func run(cmd *cobra.Command, configFile string, hostFlag string, portFlag int) error {
    apiDeps, err := Run(cmd, configFile, hostFlag, portFlag)
    if err != nil {
        return err
    }
    defer apiDeps.DB.Close()

    router := api.NewServer(apiDeps)
    addr := fmt.Sprintf("%s:%d", apiDeps.GetConfig().Server.Host, apiDeps.GetConfig().Server.Port)
    return router.Run(addr)  // 阻塞 - 不可测试
}
```

**测试策略：**
- **导出 Run()**：测试初始化，不启动 HTTP 服务器
- **保留私有 run()**：阻塞的服务器启动仍不可测试（架构限制）
- **结果**：Run() 覆盖率达 81.6%，run() 为 0%，整个包覆盖率达 64.3%

**示例测试：**
```go
func TestRun_DatabaseInit(t *testing.T) {
    if testing.Short() {
        t.Skip("integration test")
    }

    configPath, _ := setupTagTestDB(t)
    cmd := api.NewCommand()

    // 测试 Run()，不启动服务器
    deps, err := api.Run(cmd, configPath, "", 0)
    require.NoError(t, err)
    defer deps.DB.Close()

    // 验证数据库已初始化
    assert.NotNil(t, deps.DB)

    // 验证表已存在（迁移已运行）
    var tableCount int
    deps.DB.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").Scan(&tableCount)
    assert.Greater(t, tableCount, 0, "should have tables after migrations")
}
```

**测试类别（13 个测试，64.3% 覆盖率）：**
- **标志测试**（2 个）：命令结构、默认值
- **标志覆盖测试**（4 个）：host、port、两个标志、配置加载
- **集成测试**（6 个）：数据库初始化、抓取器注册表、仓库、聚合器、匹配器、任务队列
- **错误处理**（1 个）：配置未找到

**关键优势：**
- 测试所有初始化逻辑，无需处理 HTTP 复杂性
- 无需 HTTP 客户端模拟或端口冲突
- 执行速度快（13 个测试 <1s）
- 验证真实的数据库迁移、抓取器设置、仓库初始化

**架构限制：**
私有的 `run()` 函数覆盖率仍为 0%，因为 `router.Run(addr)` 会无限阻塞。这是可接受的，因为所有业务逻辑都通过导出的 `Run()` 函数进行了测试。

#### 测试 Scrape 命令（Epic 7 模式）

对于具有复杂业务逻辑和控制台输出的命令，关键在于**将可测试的业务逻辑与不可测试的 I/O 分离**：

**模式：返回数据，不输出控制台**

```go
// 导出 Run 函数，返回抓取数据但不打印
// cmd/javinizer/commands/scrape/command.go:136
func Run(cmd *cobra.Command, args []string, configFile string, deps *commandutil.Dependencies) (*models.Movie, []*models.ScraperResult, error) {
    id := args[0]

    // 加载配置并应用标志覆盖
    cfg, err := config.LoadOrCreate(configFile)
    if err != nil {
        return nil, nil, fmt.Errorf("failed to load config: %w", err)
    }
    ApplyFlagOverrides(cmd, cfg)

    // 初始化或使用注入的依赖项
    if deps == nil {
        deps, err = commandutil.NewDependencies(cfg)
        if err != nil {
            return nil, nil, err
        }
        defer deps.Close()
    }

    // 业务逻辑：缓存检查、内容 ID 解析、抓取、聚合
    // ... ~130 行可测试的逻辑 ...

    // 返回数据，不打印
    return movie, results, nil
}

// 私有 runScrape 函数处理控制台输出
func runScrape(cmd *cobra.Command, args []string, configFile string) error {
    movie, results, err := Run(cmd, args, configFile, nil)
    if err != nil {
        return err
    }

    printMovie(movie, results)  // 控制台格式化 - 不可测试
    return nil
}
```

**测试策略：**
- **导出 Run()**：测试业务逻辑（缓存、抓取、聚合），不输出控制台
- **保留私有 runScrape()**：控制台输出仍不可测试（I/O 操作）
- **结果**：通过将业务逻辑与控制台输出格式化分离，提高了命令包的可测试性。

**示例测试：**

```go
func TestRun_ConfigNotFound(t *testing.T) {
    if testing.Short() {
        t.Skip("integration test")
    }

    cmd := scrape.NewCommand()

    // 测试 Run()，使用不存在的配置
    movie, results, err := scrape.Run(cmd, []string{"TEST-001"}, "/nonexistent/config.yaml", nil)

    assert.Error(t, err)
    assert.Nil(t, movie)
    assert.Nil(t, results)
    assert.Contains(t, err.Error(), "failed to load config")
}
```

**测试基础设施（针对可执行的集成测试）：**

```go
// 用于封闭测试的模拟抓取器
type MockScraper struct {
    name string
    fail bool
}

func (m *MockScraper) Search(id string) (*models.ScraperResult, error) {
    if m.fail {
        return nil, assert.AnError
    }

    releaseDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
    return &models.ScraperResult{
        ID:          id,
        ContentID:   id,
        Title:       "Test Movie " + id,
        ReleaseDate: &releaseDate,
        Runtime:     120,
        Source:      m.name,
        SourceURL:   "http://test.com/" + id,
    }, nil
}

// 测试数据库设置辅助函数
func setupTestDB(t *testing.T) (string, *database.DB) {
    t.Helper()

    configContent := `
database:
  dsn: ":memory:"
scrapers:
  priority: ["mock1", "mock2"]
  dmm:
    enabled: true
`
    tmpFile := t.TempDir() + "/config.yaml"
    require.NoError(t, os.WriteFile(tmpFile, []byte(configContent), 0644))

    cfg, err := config.Load(tmpFile)
    require.NoError(t, err)

    db, err := database.New(cfg)
    require.NoError(t, err)
    err = db.RunMigrationsOnStartup(context.Background())
    require.NoError(t, err)

    return tmpFile, db
}
```

**测试类别（18 个测试，24.2% 覆盖率）：**
- **标志测试**（10 个）：命令结构、标志解析、默认值、验证（来自 Epic 5 的现有测试）
- **集成测试**（8 个）：配置加载、缓存命中/未命中、强制刷新、自定义抓取器、内容 ID 解析、空结果、聚合、数据库保存
  - **注意：** 由于聚合器依赖初始化复杂性（Epic 7 Story 7.2 中记录的架构限制），目前 8 个集成测试中的 7 个被跳过

**关键优势：**
- 提取了 Run() 函数以提高可测试性（主要重构目标已实现）
- 模式与 Epic 7.1 API 命令方法一致
- CLI 接口零破坏性变更
- 业务逻辑与控制台 I/O 清晰分离

**架构限制：**

由于聚合器依赖初始化需求复杂，目前 8 个集成测试中的 7 个被跳过。这些测试编写良好，采用适当的封闭设计（MockScraper、内存数据库、无 HTTP 调用），但在未来的 Epic 中解决聚合器初始化复杂性之前无法执行。

**跳过的测试示例：**

```go
func TestRun_CacheHit(t *testing.T) {
    t.Skip("Architectural limitation: aggregator dependency setup requires further refactoring")

    if testing.Short() {
        t.Skip("integration test")
    }

    configPath, db := setupTestDB(t)
    defer db.Close()

    // 预填充数据库中的测试影片
    movieRepo := database.NewMovieRepository(db)
    cachedMovie := createTestMovie("IPX-123", "Cached Movie")
    require.NoError(t, movieRepo.Upsert(cachedMovie))

    cmd := scrape.NewCommand()

    // 不带强制刷新运行 - 应命中缓存
    movie, results, err := scrape.Run(cmd, []string{"IPX-123"}, configPath, deps)

    assert.NoError(t, err)
    assert.NotNil(t, movie)
    assert.Equal(t, "Cached Movie", movie.Title)
    assert.Nil(t, results, "Cache hit should not return scraper results")
}
```

**覆盖率细分：**
```
NewCommand:          100.0% （命令结构）
ApplyFlagOverrides:  100.0% （标志覆盖）
Run:                   5.4% （业务逻辑 - 受架构限制）
runScrape:            60.0% （错误处理路径）
printMovie:            0.0% （控制台输出 - 未测试）
```

printMovie() 函数（240 行表格格式化代码）覆盖率仍为 0%。未来的工作可以将格式化逻辑提取到可测试的 `FormatMovieTable()` 函数，但由于复杂性已推迟。

**参考：** Epic 7 Story 7.2 实现了 Run() 函数提取（主要目标），完整的集成测试推迟到未来的 Epic 进行聚合器重构。

**参考：** `cmd/javinizer/commands/api/command_test.go`（API 命令：35.7% -> 64.3% 覆盖率，比 50% 目标高出 +14.3%）

#### Epic 9：TUI 可测试性重构（MVP 模式）

**问题：** Bubble Tea TUI 框架将业务逻辑与 UI 渲染紧密耦合，导致难以实现有意义的测试覆盖率。视觉渲染（lipgloss 样式、终端尺寸）无法进行单元测试，而业务逻辑（状态管理、消息处理）深埋在框架回调中。

**解决方案：** 应用 Model-View-Presenter (MVP) 模式分离关注点：
- **Presenter（可测试）：** 状态管理、消息处理、数据转换的纯函数
- **View（排除）：** 使用 lipgloss 的视觉渲染（仅手动 QA）
- **Model（薄包装器）：** 委托给 Presenter 函数

**Epic 9 目标：**
- 从 Bubble Tea 框架中提取可测试的业务逻辑
- 在可测试的 TUI 组件上实现 100% 覆盖率
- 为未来 TUI 开发建立可重复的模式

### Story 9.1：测试处理器业务逻辑

**之前（历史，工作流接缝之前）：**

*以下仅为历史背景。*

```go
type Model struct {
    pool *worker.Pool
}
```

**之后（工作流接缝）：**

```go
type Processor struct {
    wf workflow.WorkflowInterface
}
func NewProcessor(wf workflow.WorkflowInterface) *Processor {
    return &Processor{wf: wf}
}
```

**覆盖率影响：** 76.5% -> 100%（13 个测试）

### Story 9.2：从 Model 提取状态管理

提取纯状态转换函数，覆盖率 100%（12 个测试）

### Story 9.3：从 Update 提取消息处理器

提取纯消息处理器函数，覆盖率 100%（25 个测试）

### Story 9.4：从组件提取数据转换

提取纯转换函数，覆盖率 100%（22 个测试）

### Story 9.5：为关键用户流程添加集成测试

4 个集成测试，100% 通过率

### Epic 9 总结

76 个测试，在可测试的 TUI 代码上实现 100% 覆盖率

### 使用 testify

项目使用 `github.com/stretchr/testify` 进行断言

## CI/CD 集成

### GitHub Actions 工作流

项目使用 `.github/workflows/test.yml`，定义了 9 个并行任务

> **本地模拟：** `make simulate-ci` 详见 `docs/13-local-ci-testing.zh.md`。

### CI 失败场景

| 失败类型 | 原因 | 修复方法 |
|---------|-------|-----|
| 覆盖率检查失败 | 低于 75% | 添加测试 |
| 竞态检测器失败 | 数据竞争 | 修复并发访问 |
| 代码检查失败 | 代码质量 | 运行 make lint |
| 格式化失败 | 未格式化 | 运行 make fmt |
| 构建失败 | 编译错误 | 修复构建错误 |

### Codecov 集成

## 预提交钩子

## 故障排除

## 最佳实践

## 资源

## 贡献

## 测试框架和设置

| 框架/工具 | 版本 | 用途 |
|---------------|---------|---------|
| Go testing | 标准库 | 核心测试框架 |
| testify | v1.11.1 | 断言 |
| goleak | v1.3.0 | Goroutine 泄漏检测 |
| afero | v1.15.0 | 内存文件系统 |

### 测试辅助

`internal/testutil/` 包含辅助函数和构建器

### Goroutine 泄漏检测

使用 `goleak` 检测泄漏的 goroutine