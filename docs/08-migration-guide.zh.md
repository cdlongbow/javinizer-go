# 迁移指南：PowerShell 到 Go

从原始 PowerShell 版 Javinizer 迁移到 Javinizer Go 的指南。

## 主要差异

| 功能 | PowerShell | Go | 说明 |
|---------|-----------|-----|-------|
| 配置格式 | JSON | YAML | 手动迁移（见步骤 2） |
| 演员数据 | CSV (jvThumbs.csv) | SQLite 数据库 | 见步骤 4 |
| 类型映射 | CSV (jvGenres.csv) | SQLite 数据库 | 见步骤 3 |
| 性能 | 较慢 | 快很多 | 原生二进制 |
| 跨平台 | 仅 Windows | 全平台 | 单个二进制 |
| 依赖 | PowerShell 模块 | 无 | 自包含 |

## 性能对比

项目测试中的实际表现：

| 操作 | PowerShell | Go | 典型提升 |
|-----------|-----------|-----|---------------------|
| 刮削 | ~5秒/个 | ~1.5秒/个 | ~3倍 |
| 文件操作 | 较慢 | 更快 | ~10倍 |
| 元数据缓存查询 | 基于 CSV | SQLite | 大幅提升 |
| 启动 | 模块加载慢 | 原生二进制启动 | 启动更快 |

## 兼容性说明

- NFO 输出与 Kodi/Plex 工作流兼容。
- Javinizer Go 可与 PowerShell 版并行运行。
- 数据库/存储格式不同，PowerShell 和 Go 的数据库不可直接互换。

## 迁移步骤

### 1. 安装 Javinizer Go

```bash
# 下载二进制或从源码构建
javinizer init
```

`javinizer init` 会创建默认配置文件并初始化 SQLite 数据库。配置路径默认为 `configs/config.yaml`；可使用 `--config <路径>` 覆盖。

### 2. 转换配置

PowerShell 版本使用 `jvSettings.json`。Javinizer Go 使用 YAML。

**PowerShell (jvSettings.json):**
```json
{
  "sort.metadata.priority.actress": ["r18dev", "dmm"],
  "sort.metadata.priority.title": ["r18dev", "dmm"]
}
```

**Go (config.yaml):**
```yaml
metadata:
  priority:
    actress:
      - r18dev
      - dmm
    title:
      - r18dev
      - dmm
```

> **注意：** 以上优先级顺序仅为示例转换，非 Go 默认值。Go 的默认字段级 `metadata.priority` 以 `dmm` 优先（如 `actress: [dmm, r18dev, libredmm]`），而全局 `scrapers.priority` 列表默认以 `r18dev` 优先。详见[配置文档](./02-configuration.zh.md)。

> **配置版本：** Go 配置文件包含 `config_version` 字段（当前为 `3`）。加载时，旧版 Go 配置（v0/v1/v2）会自动迁移：备份现有文件并从默认值写入新配置——**自定义设置不会被保留**，因此建议手动移植 PowerShell 设置。可使用 `javinizer config migrate --dry-run` 预览。此规则仅适用于旧版 Go YAML 配置，不适用于 PowerShell 的 `jvSettings.json`。

### 3. 迁移类型替换规则

**PowerShell (jvGenres.csv):**
```csv
Original,Replacement
Blow,Blowjob
Creampie,Cream Pie
```

**推荐：从 JSON 批量导入**

`javinizer genre import <input.json>` 可一次加载多条替换规则。期望格式为包含 `original` 和 `replacement` 字段的对象 JSON 数组：

```json
[
  { "original": "Blow", "replacement": "Blowjob" },
  { "original": "Creampie", "replacement": "Cream Pie" }
]
```

将 CSV 转换为 JSON 后导入：

```bash
# 转换 jvGenres.csv → genres.json（需要 Python 3）
python3 -c "
import csv, json
with open('jvGenres.csv', newline='') as f:
    rows = list(csv.DictReader(f))
json.dump([{'original': r['Original'], 'replacement': r['Replacement']} for r in rows],
          open('genres.json', 'w'), indent=2)
"

# 导入数据库
javinizer genre import genres.json
```

导入时去重：`original` 已存在且 `replacement` 相同的条目会跳过，其他条目会更新。完成后显示 `Imported: N, Skipped: N, Errors: N`。

**备选：逐条添加**

```bash
javinizer genre add "Blow" "Blowjob"
javinizer genre add "Creampie" "Cream Pie"
```

**备选：批量脚本（CSV 循环）**

```bash
#!/bin/bash
# migrate-genres.sh

# 解析 CSV 并添加到数据库
tail -n +2 jvGenres.csv | while IFS=, read -r original replacement; do
  javinizer genre add "$original" "$replacement"
done
```

**备份或转移替换规则：**

```bash
javinizer genre export replacements-backup.json   # 写入文件
javinizer genre export                             # 输出到 stdout
javinizer genre list                               # 显示表格
```

### 4. 迁移演员数据

PowerShell 将演员缩略图存储在 `jvThumbs.csv` 中。Go 将演员记录（姓名、日文名、缩略图 URL、别名和 DMM ID）存储在 SQLite 表中，通过 `actress` 命令管理。

**从 JSON 批量导入**（`javinizer actress import <input.json>`）。期望格式为包含以下字段的对象 JSON 数组：

```json
[
  {
    "first_name": "Momo",
    "last_name": "Sakura",
    "japanese_name": "桜空もも",
    "thumb_url": "https://example.com/momo.jpg",
    "aliases": "もも|Sakura Momo",
    "dmm_id": 12345
  }
]
```

| 字段 | 描述 |
|-------|-------------|
| `first_name` / `last_name` | 罗马化的姓名 |
| `japanese_name` | 日文名（无 `id` 时用于去重） |
| `thumb_url` | 缩略图 URL |
| `aliases` | 以竖线分隔的别名列表 |
| `dmm_id` | DMM 演员 ID（可选；未知则为 `0`） |

```bash
javinizer actress import actresses.json
```

导入时按 `id` 去重（有 `id` 时），否则按 `japanese_name` 去重：相同记录跳过，不同记录更新，新记录创建。完成后显示 `Imported: N, Skipped: N, Errors: N`。

**备份、转移或合并演员：**

```bash
javinizer actress export actresses-backup.json     # 备份到文件
javinizer actress export                            # 输出到 stdout
javinizer actress merge --target 12 --source 34     # 合并 #34 到 #12（去重）
javinizer actress merge --target 12 --source 34 --non-interactive --prefer target -y
```

将 `jvThumbs.csv` 的列映射到上述 JSON 字段，然后导入。演员记录也会在刮削时自动填充，因此手动导入仅在需要保留现有缩略图或名称映射时有必要。

## 工作流对比

### PowerShell 工作流

```powershell
# 导入模块
Import-Module Javinizer

# 设置路径
Set-JavinizerLocation -Input "C:\Videos"

# 运行
Javinizer -Path "C:\Videos"
```

### Go 工作流

```bash
# 初始化（一次）
javinizer init

# 运行
javinizer sort ~/Videos
```

## 迁移建议

1. **保留 PowerShell 版本**：迁移期间两个版本并行运行
2. **在副本上测试**：不要立即处理主库
3. **对比结果**：在两个版本中刮削相同的 ID
4. **先试运行**：Go 版本始终使用 `--dry-run`
5. **备份数据**：保留 CSV 文件作为备份参考

---

**下一步**：[开发指南](./09-development.zh.md)