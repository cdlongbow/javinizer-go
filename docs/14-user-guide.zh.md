# 用户指南

本指南涵盖常见工作流，并解释 Javinizer 关键功能的行为。

## 目录

- [操作模式](#操作模式)
- [Metadata & Artwork 与 Update Metadata](#metadata--artwork-与-update-metadata)
- [Scrape & Organize 工作流](#scrape--organize-工作流)
- [Update Metadata 工作流](#update-metadata-工作流)
- [Web UI 流程](#web-ui-流程)

## 操作模式

操作模式控制组织步骤中如何处理文件。在 `config.yaml` 的 `output.operation_mode` 中设置，或在 Web UI 中启动批量操作时选择。当 `output.operation_mode` 未设置时，模式默认为 `organize`。

| 模式 | 行为 |
|------|----------|
| `organize` | 将文件移动到目标目录，重命名文件夹/文件 |
| `in-place` | 重命名文件夹和文件，但保留在同一目录中 |
| `in-place-norenamefolder` | 仅重命名文件，保留原始文件夹名称 |
| `metadata-artwork` | 将元数据保存到数据库，写入 NFO，下载图片——不移动或重命名文件 |
| `preview` | 干运行：显示将发生什么而不实际做任何更改 |

## Metadata & Artwork 与 Update Metadata

这两个功能产生几乎相同的最终结果——都将 NFO 写入源目录并下载图片，而不移动文件。关键区别：

| | Metadata & Artwork（`operation_mode`） | Update Metadata（`update=true`） |
|---|---|---|
| **NFO 内容** | 纯抓取器数据 | 与现有 NFO 合并（可配置合并策略） |
| **合并选项** | 无 | `preserve_nfo`、`force_overwrite`、`preset`、`scalar_strategy`、`array_strategy` |
| **工作流** | 两步：先抓取再组织 | 单步：抓取和写入一气呵成 |
| **何时使用** | 首次为文件获取元数据 | 重新抓取已有 NFO 的文件，并希望保留其中的字段 |

两种模式都将相同的数据保存到数据库，下载相同的文件集（海报、封面、extrafanart、预告片、演员图片），且都不移动或重命名源视频文件。

### 合并策略（仅 Update Metadata）

Update Metadata 将抓取的数据合并到磁盘上的现有 NFO 中。合并选项——也作为 `javinizer update` 的标志和批处理 API 上的 JSON 字段暴露——如下：

| 选项 | 值 | 效果 |
|--------|--------|--------|
| `scalar_strategy` | `prefer-nfo`（默认）、`prefer-scraper`、`preserve-existing`、`fill-missing-only` | 单值字段（标题、制作商、发行日期等）的合并方式 |
| `array_strategy` | `merge`（默认）、`replace` | `merge` 合并并去重数组（类别、演员等）；`replace` 使用抓取器的数组 |
| `preset` | `conservative`、`gap-fill`、`aggressive` | 覆盖 `scalar_strategy`/`array_strategy` 的便捷预设。`conservative` = preserve-existing + merge；`gap-fill` = fill-missing-only + merge；`aggressive` = prefer-scraper + replace |
| `preserve_nfo` | `true` / `false` | 永远不覆盖现有 NFO 字段，仅添加缺失数据（最保守） |
| `force_overwrite` | `true` / `false` | 忽略现有 NFO，仅使用抓取器数据（破坏性） |

### 每种模式写入磁盘的内容

两种模式都将以下内容写入源文件目录——NFO 文件由 `metadata.nfo.enabled`（默认 `true`）控制，每个媒体文件由其 `output.download_*` 选项控制（均默认 `true`）：

- **NFO 文件** — `<ID>.nfo`，XML 格式的元数据，适用于媒体管理器
- **海报图片** — `<ID>-poster.jpg`（竖版海报）
- **封面/背景** — `<ID>-fanart.jpg`（横版封面/背景）
- **Extrafanart** — `extrafanart/` 子文件夹中的截图图片，命名为 `fanart<INDEX>.jpg`（`fanart1.jpg`、`fanart2.jpg`、…）
- **预告片** — `<ID>-trailer.mp4`
- **演员图片** — `.actors/` 子文件夹中的缩略图，命名为 `<ACTORNAME>.jpg`

对于多部分影片，在文件后缀前插入 `-pt<N>` 部分后缀，例如 `IPX-535-pt1-poster.jpg`。两种模式都不移动、重命名或为源视频文件创建文件夹。

例如，抓取 `IPX-535.mp4`（Idea Pocket，2020，主演 Sakura Momo / 桜空もも）会在未触碰的源视频旁边写入：

```
IPX-535.mp4                <- 源视频（未移动或重命名）
IPX-535.nfo
IPX-535-poster.jpg
IPX-535-fanart.jpg
extrafanart/
  fanart1.jpg
  fanart2.jpg
  ...
IPX-535-trailer.mp4
.actors/
  Sakura Momo.jpg
```

## Scrape & Organize 工作流

Web UI 的 "Scrape & Organize" 按钮使用的标准两阶段工作流：

1. **Scrape** — 从配置的抓取器获取元数据，保存到数据库，并呈现结果以供审查
2. **Organize** — 应用选定的操作模式：移动/重命名文件、写入 NFO 和下载图片

操作模式决定第 2 步中发生什么。使用 `metadata-artwork` 模式时，第 2 步写入 NFO 并下载图片，但跳过所有文件操作。

## Update Metadata 工作流

Web UI 的 "Update Metadata" 按钮使用的单阶段工作流：

1. **Scrape + merge + write** — 获取元数据，与磁盘上的现有 NFO 文件合并，保存到数据库，写入更新的 NFO，并下载图片

这适用于已有 NFO 且希望更新而非替换的文件。合并策略允许你控制现有字段值如何保留或覆盖。

## Web UI 流程

Web UI（`javinizer web` / `javinizer api`）通过几个路由驱动批处理工作流：

### Browse (`/browse`)

主要的抓取工作空间（导航中的 **Scrape** 项；登录后着陆页是 `/` 的仪表盘）。你选择一个目录、选择文件、选择操作模式（Scrape & Organize 或 Update Metadata），然后启动批处理。

- **Scrape & Organize** — 启动一个批处理抓取任务，并导航到 `/review` 进行审查/组织流程。
- **Update Metadata** — 以更新模式启动批处理（将元数据合并到现有 NFO，不移动文件）。
- **Manual Scrape** — 在启动前勾选 "Manual Scrape" 复选框，以覆盖每个文件的匹配器。不立即抓取，而是将选中的文件和设置带到 `/manual`。

### Manual Scrape (`/manual`)

从 `/browse` 启用 "Manual Scrape" 后到达此页面。允许为每个选中的文件输入覆盖基于文件名的匹配器的 JAV ID 或 URL；徽章标记每个条目为 ID、URL 或 Auto（匹配器派生）。页面在会话中保留手动输入（通过 `sessionStorage`），显示将使用的已启用抓取器，提交时发送 `POST /api/v1/batch/scrape`，其中包含由文件路径索引的 `manual_inputs` 映射（见 [API 参考](./07-api-reference.zh.md#批处理操作)），并导航到 `/review`。

### Review (`/review/[jobId]`)

批处理任务的抓取后审查屏幕。标签页：

- **Movies** — 编辑每个结果的元数据（标题、演员、类别、海报裁剪、来自 URL 的海报）、排除单个影片、预览组织路径，以及重新抓取单个影片（带合并策略）。
- **Failed** — 无法匹配或抓取的文件，带有重新抓取选项。

操作栏使用选定的操作模式运行该任务的组织（或更新）步骤，并通过 `/ws/progress` WebSocket 实时流式传输进度。

### 典型路径

```
/browse  ──Scrape & Organize──▶  /review/[jobId]  ──organize──▶  done
/browse  ──Manual Scrape──▶  /manual  ──submit──▶  /review/[jobId]  ──organize──▶  done
/browse  ──Update Metadata──▶  /review/[jobId]  ──update──▶  done
```