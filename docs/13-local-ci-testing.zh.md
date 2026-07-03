# 本地 CI 测试指南

本指南说明如何在将代码推送到 GitHub 之前，在本地运行 GitHub Actions CI 检查。

## 快速开始

### 最佳选择：模拟完整 CI 流水线

```bash
make simulate-ci
```

这在本地运行 GitHub Actions 流水线的 **7 任务子集**，带彩色输出（`scripts/simulate-ci.sh` 打印 `Job 1/7` … `Job 7/7`）：
- 单元测试和覆盖率
- 竞态检测器测试
- 代码检查和代码质量
- 漏洞扫描
- 前端测试
- 构建验证
- Docker 构建验证

> **注意：** 真实的 `.github/workflows/test.yml` 定义了 **9 个任务**——模拟跳过了 `test-windows`（需要 Windows 运行器）和 `fullstack-e2e`（需要 Playwright 浏览器和 Go/Vite 堆栈）。完整列表请参见下文 [GitHub 中的 CI/CD](#github-中的-cicd)。

**输出示例：**
```
========================================
  Simulating GitHub Actions CI Locally
========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job 1/7: Unit Tests & Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Running unit tests...
✓ Unit tests passed

→ Generating coverage report...
✓ Coverage report generated

→ Checking Codecov-compatible coverage threshold (75%)...
✓ Coverage check PASSED
  78.4% >= 75%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job 2/7: Race Detector Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Running race detector on concurrent packages...
✓ Race detector tests passed

...

========================================
  CI Simulation Summary
========================================

✓ All checks passed!
Your code is ready to push to GitHub
```

## 所有测试选项

### 1. 完整 CI 模拟（推荐）

```bash
# 运行所有 CI 检查，带美观输出
make simulate-ci

# 同上（运行 scripts/simulate-ci.sh）
./scripts/simulate-ci.sh
```

**检查内容**（每个模拟任务一个模块）：
- 依赖下载 + 单元测试 + 覆盖率报告（通过 `./scripts/check_coverage.sh` 检查 75% Codecov 兼容的行覆盖率阈值）
- 并发包的竞态检测器（`internal/worker`、`internal/tui`、`internal/websocket`、`internal/api`）
- `go vet` 静态分析 + `golangci-lint`（如已安装）+ `gofmt -l .` 格式化检查
- `govulncheck` 漏洞扫描（如果未安装二进制文件，则使用 `go run golang.org/x/vuln/cmd/govulncheck@latest`）
- 前端测试（`npm ci` + `web/frontend/` 中的 Vitest）——如果 Node.js 不可用则跳过
- 构建成功和 `bin/javinizer` 二进制文件创建
- Docker 镜像构建 + `javinizer version --short` 元数据验证

**何时使用：**
- 推送到 GitHub 之前
- 发起拉取请求之前
- 做出重大变更之后
- 验证所有内容协同工作

### 2. 快速 CI 检查

```bash
# 运行核心 CI 检查（无花哨输出）
make ci
```

**运行内容**——`Makefile` 中的 `ci` 目标声明了 **8 个前置条件**：

```makefile
ci: vet lint vuln coverage-check test-race config-drift check-import-guard check-mocks
```

| # | 目标 | 强制执行的内容 |
|---|--------|------------------|
| 1 | `vet` | `go vet ./...` 静态分析 |
| 2 | `lint` | `golangci-lint run` |
| 3 | `vuln` | `govulncheck ./...`（通过 `go run golang.org/x/vuln/cmd/govulncheck@latest`） |
| 4 | `coverage-check` | `make coverage` + `./scripts/check_coverage.sh 75 coverage.out`（75% 行覆盖率） |
| 5 | `test-race` | `internal/worker`、`internal/tui`、`internal/websocket`、`internal/api` 的竞态检测器 |
| 6 | `config-drift` | `./scripts/validate-config-sync.sh`——默认值与 `configs/config.yaml.example` 保持同步 |
| 7 | `check-import-guard` | `./scripts/check_import_guard.sh`——`internal/models` 不得导入 `internal/config` |
| 8 | `check-mocks` | 重新生成 mockery 模拟；如果 `internal/mocks/` 不是最新则失败 |

> **前端：** `make ci` **不**运行前端测试。使用 `make ci-full`（= `ci` + `web-test`）添加 Vitest 套件。`fullstack-e2e` 任务不属于这两个目标——请显式运行 `make test-e2e-fullstack`。

**何时使用：**
- 开发期间的快速验证
- 修复特定问题后
- 不需要详细输出时

### 3. 单独命令

独立运行特定检查：

```bash
# 仅单元测试
make test

# 快速测试（跳过慢速集成测试）
make test-short

# 竞态检测器
make test-race

# 代码格式化
make fmt

# 静态分析
make vet

# 代码检查
make lint

# 覆盖率
make coverage
make coverage-pkg      # 按包细分
make coverage-html      # 在浏览器中查看
make coverage-check     # 检查阈值
```

**何时使用：**
- 开发期间的目标测试
- 修复特定问题（例如仅格式化）
- 需要速度而非完整性时

### 4. 使用 `act`（高级）

使用 Docker 运行**实际的** `.github/workflows/test.yml` 文件：

```bash
# 安装 act
brew install act

# 运行所有工作流
act

# 运行特定工作流
act -W .github/workflows/test.yml

# 运行特定任务——test.yml 中有效的 job id：
#   test, race-tests, lint, vuln, test-windows,
#   frontend-tests, build, docker-build, fullstack-e2e
act -j test
act -j vuln
act -j fullstack-e2e

# 干运行（查看将要发生什么而不实际运行）
act -n

# 列出可用任务
act -l
```

**输出示例：**
```
[Test & Coverage/test] 🚀  Start image=catthehacker/ubuntu:act-latest
[Test & Coverage/test]   🐳  docker pull image=catthehacker/ubuntu:act-latest
[Test & Coverage/test]   🐳  docker create image=catthehacker/ubuntu:act-latest
[Test & Coverage/test]   🐳  docker run image=catthehacker/ubuntu:act-latest
```

> **注意：** `test.yml` 通过 `ACT` 环境变量检测 `act`，并跳过 Codecov 上传和覆盖率报告产物步骤（它在本地打印覆盖率摘要）。`test` 任务仍然完全运行——仅上传步骤受到门控。

**优点：**
- 最准确（运行实际的工作流文件）
- 捕获工作流语法错误
- 测试 GitHub Actions 特定功能

**缺点：**
- 需要 Docker（启动慢）
- Docker 镜像大（约 2GB）
- 某些 GitHub 功能不支持（secrets 等）
- 比其他方法慢

**何时使用：**
- 测试工作流文件变更
- 调试复杂的 GitHub Actions 功能
- 验证自定义操作
- 需要精确的 CI 环境时

## 对比表

| 方法 | 速度 | 准确性 | 输出 | 最适合 |
|--------|-------|----------|--------|----------|
| `make simulate-ci` | 中 | 高 | 美观 | 推送前检查 |
| `make ci` | 快 | 高 | 基础 | 快速验证 |
| 单独命令 | 最快 | 中 | 基础 | 目标修复 |
| `act` | 非常慢 | 精确 | 详细 | 工作流测试 |

## 典型开发工作流

### 开发期间

```bash
# 快速反馈循环
make test-short
```

### 提交前

预提交钩子（`scripts/pre-commit.sample`）运行 **8 项检查**并阻止提交禁止的路径（例如仅本地的规划目录）：

| # | 检查 | 命令 |
|---|-------|---------|
| 1 | Go 格式化 | `gofmt -l .` |
| 2 | golangci-lint | `$HOME/go/bin/golangci-lint run ./...`（>= v2.4.0；未安装则跳过） |
| 3 | go vet | `go vet ./...` |
| 4 | 快速单元测试 | `go test -short -timeout=60s ./...` |
| 5 | 构建验证 | `go build -o /tmp/javinizer-test ./cmd/javinizer` |
| 6 | Swagger 文档 | `make swagger` 然后 `git diff --quiet -- docs/swagger/`（重新生成必须提交） |
| 7 | 前端格式化 | 对暂存的 `web/frontend/**` 文件运行 `npx prettier --check`（没有 `node_modules` 则跳过） |
| 8 | 前端类型 | 当 `web/frontend/src/` 变更时运行 `npx svelte-check --threshold error` |

检查 7–8 仅当暂存了前端文件时运行；检查 2、6、7 和 8 在未安装相应工具时优雅降级（跳过并给出警告）。

要绕过（谨慎使用）：
```bash
git commit --no-verify -m "WIP"
```

### 推送前

```bash
# 完整 CI 模拟
make simulate-ci
```

如果任何检查失败，脚本会精确告诉你需要修复什么：
```
✗ 2 check(s) failed:
  - Lint - Formatting
  - Unit Tests - Coverage Threshold

Fix these issues before pushing to GitHub
```

### 修复问题后

```bash
# 仅运行失败的检查
make fmt                # 如果格式化失败
make coverage-check     # 如果覆盖率失败

# 然后重新运行完整模拟
make simulate-ci
```

## 故障排除

### `golangci-lint` 未安装

如果看到：
```
⚠ golangci-lint not installed (skipping)
  Install: brew install golangci-lint
```

安装它：
```bash
# macOS
brew install golangci-lint

# Linux
curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin

# 或使用 go install
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### 测试超时

`simulate-ci.sh` 使用 Go 默认的每个包 10 分钟超时运行 `go test -v ./...`（预提交钩子使用 `-timeout=60s`）。要运行更快或预算更长的子集：
```bash
# 仅竞态测试（可能较慢）
make test-race

# 所有测试，显式加长超时
go test -timeout=15m ./...

# 单个包，快速
go test -short -timeout=60s ./internal/matcher/...
```

### 覆盖率检查失败

如果覆盖率低于 75%，有以下选项：
```bash
# 查看覆盖率以了解哪些需要测试
make coverage-html

# 检查按包细分
make coverage-pkg

# 临时使用较低阈值运行
./scripts/check_coverage.sh 20 coverage.out

# 或更新阈值（保持两个文件同步）：
#   Makefile:                  ./scripts/check_coverage.sh 75 coverage.out
#   .github/workflows/test.yml: ./scripts/check_coverage.sh 75 coverage.out
```

### 竞态检测器失败

发现竞态条件：
```bash
# 带详细输出运行竞态检测器
go test -race -v ./internal/worker/...

# 常见问题：
# - 未保护的共享变量
# - 缺少互斥锁
# - 通道发送/接收竞态
```

### 构建失败

```bash
# 清理构建缓存
go clean -cache

# 删除旧二进制文件
make clean

# 重新尝试构建
make build
```

### `act` Docker 问题

```bash
# 拉取最新的运行器镜像
docker pull catthehacker/ubuntu:act-latest

# 如果问题持续，清除 Docker 缓存
docker system prune -a
```

## GitHub 中的 CI/CD

推送到 GitHub 时，工作流自动运行：

1. **触发条件：**
   - 推送到 `master`、`main` 或 `develop` 分支
   - 针对这些分支的拉取请求

2. **并行运行的任务**（`.github/workflows/test.yml` 中的 9 个任务）：
   - `test` — 单元测试和覆盖率（上传到 Codecov；`timeout-minutes: 20`）
   - `race-tests` — 竞态检测器测试（`timeout-minutes: 30`）
   - `lint` — 代码检查和代码质量：`go vet`、`internal/api` 的 700 行大小限制、`golangci-lint` v2.9.0、`gofmt` 检查（`timeout-minutes: 15`）
   - `vuln` — 通过 `govulncheck@v1.5.0` 进行漏洞扫描（`timeout-minutes: 10`）
   - `test-windows` — 单元测试（Windows），在 `windows-latest` 上运行 `go test -short ./...`（`timeout-minutes: 25`）
   - `frontend-tests` — 前端测试，Node 22 + Vitest（`timeout-minutes: 15`）
   - `build` — 构建验证：`make build`、Swagger 重新生成 + 漂移检查、mockery `check-mocks`、二进制 + 嵌入 Web UI 冒烟测试（`timeout-minutes: 15`）
   - `docker-build` — Docker 构建验证 + 镜像标签/版本元数据检查（`timeout-minutes: 30`）
   - `fullstack-e2e` — 全栈端到端测试：`make test-e2e-fullstack`（Playwright：浏览器 → SvelteKit → Go API → worker → `:memory:` SQLite）。无 `if:` 门控，因此在每次推送/PR 上运行（`timeout-minutes: 30`）

3. **结果：**
   - 绿色勾 ✅ = 全部通过
   - 红色叉 ❌ = 有失败
   - 黄色点 🟡 = 进行中

4. **覆盖率跟踪：**
   - 自动上传到 Codecov
   - PR 评论显示覆盖率变化
   - README 中的徽章更新

## 最佳实践

### 推送前始终执行

```bash
# 运行完整模拟
make simulate-ci

# 如果通过，可以推送
git push
```

### 开发期间的快速检查

```bash
# 更改测试后
make test

# 更改并发代码后
make test-race

# 重构后
make coverage-html  # 查看破坏了什么
```

### 预提交钩子

一次性安装：
```bash
cp scripts/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

现在每次提交自动运行 8 项预提交检查（格式化、golangci-lint、go vet、快速测试、构建、Swagger 漂移、前端格式化、前端类型），并防止提交禁止的路径。完整表格请参见[提交前](#提交前)。

### 持续改进

随着覆盖率增加，提高阈值：
```bash
# 编辑 Makefile
coverage-check: coverage
	@./scripts/check_coverage.sh 80 coverage.out  # 原来是 75

# 编辑 .github/workflows/test.yml
- name: Check coverage threshold
  run: ./scripts/check_coverage.sh 80 coverage.out  # 原来是 75
```

## 总结

| 阶段 | 命令 | 目的 |
|-------|---------|---------|
| 开发期间 | `make test-short` | 快速反馈 |
| 提交前 | 自动（预提交钩子） | 捕获明显问题 |
| 推送前 | `make simulate-ci` | 完整 CI 检查 |
| GitHub 上 | 自动（GitHub Actions） | 官方 CI |

**黄金法则：** 如果 `make simulate-ci` 在本地通过，GitHub CI 几乎肯定也会通过。

> **警告：** `simulate-ci` 覆盖 9 个工作流任务中的 7 个——它跳过 `test-windows`（Windows 运行器）和 `fullstack-e2e`（Playwright）。如果你的变更涉及 Windows 路径处理或全栈浏览器→API 堆栈，运行 `act -j test-windows` / `make test-e2e-fullstack`（或推送并观察 CI）来覆盖这一缺口。