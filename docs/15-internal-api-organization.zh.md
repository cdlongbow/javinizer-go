# 内部 API 组织

通过子包边界保持 `internal/api` 可维护性的约定。

## 包映射

`internal/api` 组织为基础包、横切包和每个 HTTP 领域一个包。基础包包含共享基础设施；横切包提供跨处理器使用的错误和中间件辅助；领域包各自拥有一个功能表面并注册其自己的路由。

基础包：

- `internal/api/contracts`：共享的请求/响应 DTO 和错误负载（例如 `ErrorResponse`、`RevertFileError`），以及跨处理器使用的 JSON/时间格式化辅助。
- `internal/api/core`：依赖容器（`APIDeps`）、运行时状态（`RuntimeState`、`APIRuntime`）、引导入口点（`BootstrapAPI`）和共享安全/路径辅助——路径验证、令牌存储、分页、HTTP 错误、inode 和 Windows 路径规范化、更新检查器和热重载。
- `internal/api/server`：Gin 路由组合。`NewServer(rt)` 构建引擎并接入 CORS、文档路由、`/api/v1` 路由组、嵌入的静态 Web UI 和无路由回退。
- `internal/api/testkit`：共享的 API 测试工具——`MockScraperWithResults`、`NewMockMovieRepo`/`NewMockActressRepo`、`CreateTestDeps`、`GetTestRuntime`/`SetTestRuntime`、`InitTestWebSocket` 和 `CleanupServerHub`。

横切包（无路由；由跨领域的处理器使用）：

- `internal/api/apperrors`：API 错误类型（`PathError`、`errorCode` 常量）和 `WriteAPIError` 响应写入器。
- `internal/api/middleware`：共享的 Gin 中间件——`ValidateJobID`（`:id` 任务参数路径遍历防护）和由 `IPRateLimiter` 支持的 `RateLimitMiddleware`。

领域包（每个拥有一个功能表面，从 `internal/api/server` 接入）：

- `actress` — 演员目录：列表、搜索、CRUD、合并预览/执行、导入/导出。
- `auth` — 身份验证端点（`/auth/status`、`/auth/setup`、`/auth/login`、`/auth/logout`）；暴露 `RegisterPublicRoutes`，在受保护组之前挂载到 `/api/v1` 上。
- `batch` — 批处理抓取/组织/重新抓取工作流、每个结果的操作（重新抓取、排除、预览、海报）、取消、更新和删除。
- `events` — 事件日志端点：列表、统计和清除（`GET`/`DELETE /events`）。
- `file` — 文件系统端点：当前工作目录、扫描、浏览和路径自动完成。
- `genre` — 类别列表及替换 CRUD、导入/导出和更新。
- `history` — 历史日志：列表、统计和删除（单条或全部）。
- `jobs` — 任务状态、操作、回滚检查和回滚（任务级别和每个影片）。
- `movie` — 影片抓取、列表/获取、重新抓取和 NFO 比较。
- `realtime` — WebSocket 进度端点（`/ws/progress`）；`RegisterRoutes` 在引擎根路径挂载，在 `/api/v1` 之外。
- `system` — 系统配置（`GET`/`PUT`）、抓取器列表、代理测试和翻译模型/DeepL 使用量；还暴露 `RegisterCoreRoutes`，在引擎根路径挂载 `GET /health`。
- `temp` — 临时/海报图片端点（海报服务、临时图片、存储的海报）。
- `token` — API 令牌管理：列表、创建、删除和重新生成。
- `version` — 构建/版本信息和更新检查（`GET /version`、`POST /version/check`）。

## 路由注册

所有路由在 `internal/api/server` 中组合。`NewServer(rt)` 按顺序接入引擎：CORS 中间件、文档路由（`/docs/openapi.json`、`/docs`、`/swagger/*`）、核心路由、`/api/v1` 路由、嵌入的静态 Web UI 和无路由回退。

- `registerCoreRoutes` 在引擎根路径挂载端点，在 `/api/v1` 之外：`system.RegisterCoreRoutes`（`GET /health`）和 `realtime.RegisterRoutes`（`/ws/progress`）。
- `registerAPIV1Routes` 创建 `/api/v1` 组，调用 `auth.RegisterPublicRoutes`（公共身份验证端点），然后构建一个由 `auth.RequireTokenOrSession` 保护的 `protected` 子组和一个额外通过 `middleware.RateLimitMiddleware` 限速的 `writeProtected` 子组。每个领域包的 `RegisterRoutes` 调用在其适当的子组下挂载处理器。

## 防护措施

- 将路由组合保持在 `internal/api/server` 中；领域包暴露 `RegisterRoutes(protected *gin.RouterGroup, ...)` 并从那里接入。例外：`auth` 暴露 `RegisterPublicRoutes`（在受保护组之前挂载的公共端点）；`realtime.RegisterRoutes` 和 `system.RegisterCoreRoutes` 在引擎根路径挂载，在 `/api/v1` 之外；`apperrors` 和 `middleware` 是无路由的横切包。
- 将仅限领域的逻辑保留在其领域包内；将跨领域/共享逻辑放在 `core` 或 `contracts` 中。
- 避免处理器包之间的跨领域导入，除非明确批准用于共享运行时行为。
- 将私有辅助函数放在靠近调用站点的地方，并在文件变大之前按关注点拆分。

## 大小策略

- `internal/api/**` 中的非测试 Go 文件应保持在 `700` 行以下。
- CI 通过 `scripts/check_api_file_size.sh` 递归执行此检查，在 `.github/workflows/test.yml` 的 `lint` 任务中的 "Check internal/api file size guardrail" 步骤中调用为 `./scripts/check_api_file_size.sh 700 internal/api`。该脚本排除 `*_test.go` 并使用 `find` 递归。
- 如果文件接近限制，请在添加新功能之前按行为拆分。