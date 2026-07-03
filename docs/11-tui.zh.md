# Javinizer TUI 指南

## 概述

Javinizer TUI（终端用户界面）提供了一种交互式方式来浏览、选择和处理 JAV 文件，并支持实时进度跟踪。基于 Bubble Tea 构建，为批量文件操作提供了现代、响应式的界面。

## 功能特性

- **交互式文件浏览器**：使用键盘快捷键导航和选择多个文件
- **实时进度跟踪**：监控并发任务执行，实时更新
- **任务仪表盘**：查看统计信息和整体进度
- **实时日志**：查看详细的操作日志，实时呈现
- **并发处理**：通过可配置的工作线程池并行处理多个文件
- **帮助系统**：内置的键盘快捷键参考

## 安装

```bash
# 从源码构建
go build -o javinizer ./cmd/javinizer

# 或直接安装
go install github.com/javinizer/javinizer-go/cmd/javinizer@latest
```

## 使用方法

### 基本用法

```bash
# 在当前目录启动 TUI
javinizer tui

# 扫描特定目录
javinizer tui /path/to/jav/files

# 递归扫描（默认）
javinizer tui /path/to/files -r

# 非递归扫描
javinizer tui /path/to/files --recursive=false
```

### 高级选项

```bash
# 指定源目录和目标目录
javinizer tui --source /source/path --dest /destination/path

# 或使用位置参数
javinizer tui /source/path -d /destination/path

# 移动文件而非复制
javinizer tui /source/path -d /dest/path -m

# 硬链接文件而非复制（与 --move 不兼容）
javinizer tui /source/path -d /dest/path --link-mode hard

# 干运行模式（仅预览）
javinizer tui /source/path --dry-run

# 下载 extrafanart（截图）
javinizer tui /source/path --extrafanart

# 自定义抓取器优先级
javinizer tui /source/path --scrapers r18dev,dmm

# 组合选项
javinizer tui /source \
  -d /dest \
  --move \
  --recursive \
  --extrafanart \
  --scrapers dmm,r18dev
```

### 可用标志

```bash
-s, --source string      # 源目录（替代位置参数）
-d, --dest string        # 目标目录（默认：与源目录相同）
-r, --recursive          # 递归扫描子目录（默认 true）
-m, --move               # 移动文件而非复制
-n, --dry-run            # 预览操作，不实际修改
    --link-mode string   # 复制操作的链接模式：none、hard、soft（默认 "none"）
    --extrafanart        # 下载 extrafanart（截图）
-p, --scrapers strings   # 抓取器优先级（逗号分隔）
    --update-mode        # 更新模式：将元数据与现有 NFO 合并，跳过文件组织
    --preset string      # 合并策略预设：conservative、gap-fill 或 aggressive（更新模式）
    --scalar-strategy string  # 更新模式的标量字段合并策略（默认 "prefer-nfo"）
    --array-strategy string   # 更新模式的数组字段合并策略（默认 "merge"）
-v, --verbose            # 启用调试日志
```

### 更新模式

传递 `--update-mode` 可将新抓取的元数据合并到现有 NFO 文件中，而不移动或重命名视频文件。这相当于 `javinizer update` CLI 命令（请参阅 [CLI 参考](./03-cli-reference.zh.md#update)）。使用 `--preset`（`conservative`、`gap-fill`、`aggressive`）或显式的 `--scalar-strategy`/`--array-strategy` 标志来控制如何保留或覆盖现有 NFO 值。

`--preset` 展开为固定的标量 + 数组策略对：

| 预设 | 标量策略 | 数组策略 | 行为 |
|--------|------------------|-----------------|----------|
| `conservative` | `preserve-existing` | `merge` | 保留所有现有 NFO 值；仅合并缺失的数组条目 |
| `gap-fill` | `fill-missing-only` | `merge` | 仅填充 NFO 中为空的字段；合并数组 |
| `aggressive` | `prefer-scraper` | `replace` | 信任新抓取的数据；完全覆盖现有 NFO |

当设置 `--preset` 时，它会覆盖 `--scalar-strategy` 和 `--array-strategy`。有效的标量策略为 `prefer-nfo`（默认）、`prefer-scraper`、`merge-arrays`、`preserve-existing` 和 `fill-missing-only`；有效的数组策略为 `merge`（默认）和 `replace`。你也可以在运行时从 Settings 视图切换更新模式（见下文）。

### 链接模式

`--link-mode` 控制复制操作期间文件如何放置到目标目录：

| 值 | 行为 |
|-------|----------|
| `none`（默认） | 正常复制文件 |
| `hard` | 在目标目录创建硬链接而非复制 |
| `soft` | 在目标目录创建符号链接而非复制 |

链接模式与移动模式互斥。TUI 在启动时会拒绝组合使用——无论移动模式来自 `--move` 标志还是 `config.yaml` 中的 `move_files: true`——但两种路径报告的差异不同。当设置了 `--move` 时，启动失败并显示 `--link-mode can only be used when --move is disabled`；当移动模式仅来自 `config.yaml` 中的 `move_files: true`（没有 `--move` 标志）时，启动失败并显示 `--link-mode can only be used when move mode is disabled (move_files is false and --move is not set)`。同样，Settings 视图在链接模式激活时拒绝启用 Move Files 切换。

## 界面

### 视图

TUI 有四个主要标签页视图，可通过数字键或 Tab 访问：

1. **Browser (1)**：文件选择和管理
2. **Dashboard (2)**：统计信息和进度概览
3. **Logs (3)**：实时操作日志
4. **Settings (4)**：运行时处理开关

帮助视图可通过 `?` 键打开。

### 浏览器视图

浏览器显示已发现的视频文件及其匹配状态：

```
Files
----------------------------------------
☐ IPX-123.mp4              [Matched]
☑ ABP-456.mkv              [Matched]
☐ STARS-789.mp4            [Matched]
☐ random_file.mp4          [Not Matched]

45/120 files | 3 selected
```

**指示器：**
- `☐` - 未选择
- `☑` - 已选择待处理
- `[Matched]` - JAV ID 已成功识别
- `[Not Matched]` - 未找到 JAV ID

### 仪表盘视图

显示实时统计信息：

```
Dashboard
----------------------------------------
Total:     120
Running:   5
Success:   45
Failed:    2

Progress:  42.3%
Elapsed:   2m 15s
```

### 任务列表

显示活动中的和最近完成的任务：

```
Tasks
----------------------------------------
[RUN] [████████░░] scrape-IPX-123
[OK]  [██████████] download-ABP-456
[ERR] [█████░░░░░] organize-STARS-789
[...] [░░░░░░░░░░] nfo-IPX-123
```

**状态指示器：**
- `[RUN]` - 正在运行
- `[OK]` - 成功完成
- `[ERR]` - 失败并报错
- `[...]` - 等待/排队中

### 日志视图

可实时滚动的日志：

```
Logs
----------------------------------------
15:04:32 [INFO]  Scanned 120 files
15:04:33 [INFO]  Matched 98 JAV IDs
15:04:35 [INFO]  Started processing
15:04:36 [INFO]  Scraped IPX-123
15:04:37 [WARN]  Rate limit reached, waiting...
15:04:40 [ERROR] Failed to download: connection timeout
```

### 设置视图

运行时处理开关列表，可在不重启 TUI 的情况下切换。使用 `↑`/`↓`（或 `k`/`j`）导航，按 `Space` 切换高亮行：

| # | 设置 | 启用时的效果 |
|---|---------|---------------------|
| 0 | Dry Run | 预览操作，不写入任何文件 |
| 1 | Force Update | 覆盖已存在的已组织文件/NFO |
| 2 | Force Refresh | 清除缓存的数据库元数据并重新抓取 |
| 3 | Move Files | 移动文件而非复制（持久化到 `config.yaml`；链接模式激活时无法启用） |
| 4 | Scrape | 查询抓取器获取元数据 |
| 5 | Download | 获取封面、海报、截图和演员图片 |
| 6 | Extrafanart | 下载 extrafanart（截图） |
| 7 | Organize | 将文件移动/复制到目标目录，使用格式化名称 |
| 8 | NFO | 生成 Kodi 兼容的 NFO 文件 |
| 9 | Update Mode | 将元数据合并到现有 NFO 而不组织文件（自动禁用 Organize） |

切换 **Move Files**（第 3 行）会写回 `config.yaml`，以便重启后保持。切换 **Update Mode**（第 9 行）会自动禁用——并在之后重新启用——**Organize**。

## 键盘快捷键

### 全局

| 键 | 操作 |
|-----|--------|
| `?` | 切换帮助视图 |
| `1` / `b` | 切换到浏览器视图 |
| `2` | 切换到仪表盘视图 |
| `3` | 切换到日志视图 |
| `4` | 切换到设置视图 |
| `Tab` | 循环切换视图 |
| `d` | 关闭处理完成横幅 |
| `q` / `Ctrl+C` | 退出应用 |

### 浏览器视图

| 键 | 操作 |
|-----|--------|
| `f` | 打开源文件夹选择器 |
| `o` | 打开输出文件夹选择器 |
| `m` | 打开手动搜索模态框 |
| `M` | 打开演员合并模态框 |
| `r` | 刷新/重新扫描当前源路径 |
| `↑` / `k` | 向上移动光标 |
| `↓` / `j` | 向下移动光标 |
| `Space` | 切换文件选择状态 |
| `a` | 选择所有已匹配文件 |
| `A` | 取消选择所有文件 |
| `Enter` | 开始处理选中的文件 |
| `p` | 暂停/恢复处理 |

### 手动搜索模态框

从浏览器视图按 `m` 打开手动搜索模态框。输入 JAV ID 或 URL，并勾选要查询的抓取器（默认不选择任何抓取器——至少选择一个）。

| 键 | 操作 |
|-----|--------|
| `Tab` | 在 ID 输入框和抓取器列表之间切换焦点 |
| `↑` / `↓` | 移动抓取器列表光标（当列表聚焦时） |
| `Space` | 勾选/取消勾选高亮的抓取器（当列表聚焦时） |
| `Enter` | 使用输入的 ID 和选中的抓取器运行抓取 |
| `Esc` | 取消并关闭 |

### 演员合并模态框

从浏览器视图按 `M` 打开手动演员合并模态框。将一个演员记录（**源**）合并到另一个（**目标**，保留者），并将源的影片和别名重新指向目标。

**输入步骤**——输入数字演员 ID：

| 键 | 操作 |
|-----|--------|
| `Tab` / `↑` / `↓` | 在目标 ID 和源 ID 字段之间切换 |
| `Enter` | 在目标上：将焦点移到源。在源上：加载冲突预览 |
| `Esc` / `q` | 取消并关闭 |

**冲突步骤**——在应用前解决差异字段：

| 键 | 操作 |
|-----|--------|
| `↑` / `k` | 上一个冲突字段 |
| `↓` / `j` | 下一个冲突字段 |
| `t` / `h` / `←` | 保留该字段的目标值 |
| `s` / `l` / `→` | 使用该字段的源值 |
| `Space` | 切换该字段的目标值和源值 |
| `Enter` | 应用合并 |
| `r` | 返回 ID 输入 |
| `Esc` / `q` | 取消并关闭 |

**结果步骤**——显示更新的影片、已解决的冲突和新增的别名数量：

| 键 | 操作 |
|-----|--------|
| `Enter` / `Esc` / `q` | 关闭模态框 |
| `r` | 保持相同目标 ID 开始新的合并 |

### 日志视图

| 键 | 操作 |
|-----|--------|
| `↑` / `k` | 向上滚动 |
| `↓` / `j` | 向下滚动 |
| `g` | 跳转到顶部 |
| `G` | 跳转到底部 |
| `a` | 切换自动滚动 |

### 仪表盘视图

| 键 | 操作 |
|-----|--------|
| `r` | 重置运行时间计时器/刷新统计信息 |

### 设置视图

| 键 | 操作 |
|-----|--------|
| `↑` / `k` | 向上移动光标 |
| `↓` / `j` | 向下移动光标 |
| `Space` | 切换高亮设置 |

## 配置

TUI 使用 `configs/config.yaml` 中的设置：

```yaml
performance:
  max_workers: 5          # 并发任务数 (1-100)
  worker_timeout: 300     # 任务超时时间，单位秒 (10-3600)
  buffer_size: 100        # 进度更新缓冲区
  update_interval: 100    # UI 刷新率，单位毫秒 (10-5000)

logging:
  output: "stdout,data/logs/javinizer.log"  # 见下方说明
  level: info             # debug、info、warn、error
  format: text            # text 或 json
  max_size_mb: 10         # 轮转前最大文件大小，单位 MB（0 = 禁用）
  max_backups: 5          # 保留的轮转文件数（0 = 无限制）
  max_age_days: 0         # 保留的最大天数（0 = 无限制）
  compress: true          # 压缩轮转文件
```

TUI 使用 `tea.WithAltScreen` 运行，因此日志记录器在启动时重新配置为**仅文件**输出：`logging.output` 中的任何 `stdout`/`stderr` 目标都会被移除，以防止日志破坏 TUI 显示。剩余的文件目标按原样使用，因此在默认配置下 TUI 写入 `data/logs/javinizer.log`。如果 `logging.output` 中完全没有文件目标，则回退到 `data/logs/javinizer-tui.log`。日志轮转设置（`max_size_mb`、`max_backups`、`max_age_days`、`compress`）保持不变。

### 性能调优

**max_workers**：并发任务数
- **低 (1-3)**：缓慢但对系统/网络友好
- **中 (4-6)**：平衡性能
- **高 (7-10)**：快速但资源密集
- **极高 (11+)**：最高速度，可能触发速率限制

**worker_timeout**：每个任务的最大时间
- 网络慢时增加
- 在卡住任务上快速失败时减少

**buffer_size**：进度更新队列大小
- 处理大量文件 (100+) 时增加
- 默认值 (100) 适用于大多数情况

## 处理流水线

按 Enter 键后，每个选中的文件经过以下步骤：

1. **Scrape**：查询配置的抓取器（例如 R18Dev、DMM）获取元数据
2. **Download**：获取封面、海报、截图和演员图片
3. **Organize**：将文件移动/复制到目标目录，使用格式化名称
4. **NFO**：生成 Kodi 兼容的 NFO 文件及元数据

任务并发运行，最多达到 `max_workers` 限制。

## 工作流示例

### 基本工作流

1. 启动 TUI：
   ```bash
   javinizer tui /path/to/videos
   ```

2. 等待扫描完成（显示在日志中）

3. 在浏览器中查看匹配的文件

4. 选择文件：
   - 使用方向键导航
   - 按 `Space` 选择单个文件
   - 或按 `a` 选择所有已匹配文件

5. 按 `Enter` 开始处理

6. 监控进度：
   - 按 `2` 查看仪表盘视图
   - 按 `3` 查看日志
   - 按 `1` 返回浏览器

7. 完成后按 `q`

### 高级工作流

```bash
# 第 1 步：扫描并组织
javinizer tui /downloads -d /organized --move

# 在 TUI 中：
# - 选择文件
# - 按 Enter
# - 等待完成
# - 按 Tab 查看日志
# - 按 q 退出
```

## 错误处理

### 常见错误

**"No scrapers available"**
- 在 config.yaml 中配置至少一个抓取器
- 如有需要，检查抓取器凭据

**"Failed to scrape"**
- 抓取器可能宕机或正在限速
- 稍后重试或使用不同的抓取器

**"Download failed"**
- 网络问题或速率限制
- 源上的文件可能不可用

**"Organize failed"**
- 目标路径不存在
- 权限问题
- 磁盘已满

### 恢复

- 失败的任务会记录详细信息
- 其他任务继续处理
- 重新运行 TUI 重试失败的文件
- 检查日志文件（默认 `data/logs/javinizer.log`——参见[配置](#配置)）

## 提示与技巧

1. **使用过滤器**：按 `A` 取消选择所有文件，然后手动选择你需要的

2. **监控资源**：切换到仪表盘视图查看活跃的工作线程

3. **必要时暂停**：按 `p` 暂停，进行修改，然后按 `p` 恢复

4. **经常检查日志**：按 `3` 及早发现错误

5. **速率限制**：如果看到大量失败，减少 `max_workers`

6. **先测试**：在处理整个库之前先测试几个文件

7. **使用干运行**：先用 `sort` 命令测试组织：
   ```bash
   javinizer sort /path --dry-run
   ```

## 故障排除

### TUI 无法启动

```bash
# 检查终端大小（最小 80x24）
echo $COLUMNS x $LINES

# 使用显式路径尝试
javinizer tui .

# 检查日志（logging.output 中的默认文件目标）
cat data/logs/javinizer.log
```

### 文件未匹配

- 检查文件名格式（应包含 JAV ID）
- 验证 config.yaml 中的匹配器配置
- 运行 `javinizer sort /path --dry-run` 测试匹配

### 处理卡住

- 按 `2` 查看仪表盘
- 检查工作线程是否活跃
- 按 `q` 退出并检查日志
- 可能需要增加 `worker_timeout`

### UI 故障

- 调整终端大小
- 按 `Ctrl+L` 重新绘制
- 确保终端支持 UTF-8

## 技术细节

### 架构

```
┌─────────────────┐
│   Bubble Tea    │  UI 框架
├─────────────────┤
│   TUI Model     │  状态管理
├─────────────────┤
│   Coordinator   │  任务编排
├─────────────────┤
│   Worker Pool   │  并发执行
├─────────────────┤
│   Progress      │  状态跟踪
│   Tracker       │
└─────────────────┘
```

### 组件

- **Model**：应用状态和逻辑
- **Views**：Browser、Dashboard、Logs、Settings（Help 是 `?` 切换覆盖层，不是标签页）
- **Components**：可重用的 UI 组件
- **Coordinator**：任务提交和生命周期管理
- **Worker Pool**：并发任务执行
- **Progress Tracker**：线程安全的进度监控

### 线程模型

- **主线程**：UI 渲染和事件处理
- **工作线程 goroutine**：任务执行（受 `max_workers` 限制）
- **进度 goroutine**：更新收集和通知
- **计时 goroutine**：周期性 UI 刷新

所有 goroutine 通过通道协调，确保线程安全。

## 参见

- [配置指南](./02-configuration.zh.md)
- [CLI 参考](./03-cli-reference.zh.md)
- [文件匹配](./02-configuration.zh.md#文件匹配)
- [刮削器配置](./02-configuration.zh.md#刮削器配置)