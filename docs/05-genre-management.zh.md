# 类型管理

Javinizer Go 提供基于数据库的类型替换系统，用于自定义来自刮削源的类型名称。

## 概述

不同的刮削源可能对同一概念使用不同的类型名称。类型替换允许您将这些名称统一为您偏好的术语。

### 为什么要使用类型替换？

- **一致性**：统一不同刮削源的类型名称
- **清晰性**：替换缩写或不明确的类型名称
- **个性化**：使用对您有意义的术语
- **组织性**：在媒体库中实现更好的筛选和搜索

## 配置

类型替换是一个基于 SQLite 的功能，在 `configs/config.yaml` 的 `metadata.genre_replacement` 下配置：

```yaml
metadata:
  genre_replacement:
    enabled: true
    auto_add: true
```

| 键 | 默认值 | 描述 |
|-----|---------|-------------|
| `enabled` | `true` | 总开关。设为 `false` 时，即使数据库中存在替换规则，类型也会原样通过。 |
| `auto_add` | `true` | 当刮削到的类型没有显式替换规则时，将其保存为恒等映射，以便后续通过 CLI、API 或 SQL 进行编辑。 |

两者默认均为 `true`，因此替换功能开箱即用。禁用 `enabled` 可在不删除映射规则的情况下绕过替换。

> **注意：** 类型替换与单词替换不同。单词替换（`metadata.word_replacement`，默认禁用）对所有文本字段进行子串搜索替换，在类型替换之前运行。详见[处理流程](#处理流程)。

## 命令

`genre` 命令管理存储在数据库中的替换规则。运行 `javinizer genre --help` 查看所有子命令。

### 添加替换

```bash
javinizer genre add <原始名称> <替换名称>
```

更新映射。对已存在的 `original` 运行 `add` 会更新其 `replacement`。

**示例：**
```bash
javinizer genre add "Blow" "Blowjob"
javinizer genre add "Creampie" "Cream Pie"
javinizer genre add "Beautiful Girl" "Beauty"
```

### 查看替换列表

```bash
javinizer genre list
```

**输出：**
```
=== Genre Replacements ===
Original                       → Replacement
-----------------------------------------------------------------
Blow                           → Blowjob
Creampie                       → Cream Pie
Beautiful Girl                 → Beauty

Total: 3 replacements
```

### 删除替换

```bash
javinizer genre remove <原始名称>
```

### 导出替换

```bash
javinizer genre export [output.json]
```

将所有替换以 JSON 数组形式写入，按 `original` 排序。无文件参数时输出到 stdout；有文件参数时写入该文件。

导出格式与导入格式一致：

```json
[
  {
    "id": 1,
    "original": "Blow",
    "replacement": "Blowjob",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

### 导入替换

```bash
javinizer genre import <input.json>
```

加载替换的 JSON 数组。只有 `original` 和 `replacement` 是必填字段；`id` 和时间戳在导入时被忽略。

```json
[
  {"original": "Blow", "replacement": "Blowjob"},
  {"original": "Creampie", "replacement": "Cream Pie"}
]
```

导入是幂等的且支持合并：
- **跳过** — `original` 和 `replacement` 都与已有行匹配的条目
- **导入** — 新条目，或 `original` 已存在但 `replacement` 不同的条目
- **错误** — 持久化失败的行

```bash
javinizer genre import genre-replacements.json
# Imported: 2, Skipped: 0, Errors: 0
```

## 处理流程

1. **存储**：替换规则存储在 SQLite 数据库的 `genre_replacements` 表中
2. **缓存**：聚合器的类型处理器初始化时加载到内存映射中，并按需重新加载
3. **应用**：在元数据聚合期间，对每个类型标记应用替换，在单词替换之后、忽略过滤器之前执行
4. **自动添加**：当 `auto_add: true` 时，无显式映射的标记会保存为恒等映射
5. **持久化**：重启后保留，不涉及 CSV 文件

### 处理顺序

```
刮削源 → 原始类型 → 应用单词替换 → 应用类型替换 → 应用忽略过滤器 → 最终类型
```

## 常见替换

### 规范化缩写

```bash
javinizer genre add "3P" "Threesome"
javinizer genre add "POV" "Point of View"
```

### 统一不一致的名称

```bash
javinizer genre add "Big Tits" "Big Breasts"
javinizer genre add "Busty" "Big Breasts"
```

### 简化长名称

```bash
javinizer genre add "Beautiful Girl" "Beauty"
javinizer genre add "Slender Figure" "Slender"
```

## HTTP API

类型替换也可以通过 REST API 管理（需要认证）。所有路由以 `/api/v1` 为前缀：

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/genres` | 列出数据库中所有类型 |
| `GET` | `/api/v1/genres/replacements` | 列出类型替换 |
| `POST` | `/api/v1/genres/replacements` | 创建类型替换 |
| `PUT` | `/api/v1/genres/replacements` | 更新类型替换 |
| `DELETE` | `/api/v1/genres/replacements` | 删除类型替换 |

## 数据库详情

类型替换存储在 `genre_replacements` 表中：

```sql
CREATE TABLE IF NOT EXISTS genre_replacements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original TEXT NOT NULL,
    replacement TEXT NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_genre_replacements_original ON genre_replacements(original);
```

## 故障排除

### 替换未生效

1. **检查 `enabled`**：确认 `metadata.genre_replacement.enabled: true`
2. **检查拼写**：确保精确的大小写匹配
3. **验证已添加**：运行 `javinizer genre list`
4. **重新刮削**：清除缓存并重新刮削

### 替换丢失

- 替换存储在数据库中
- 如果数据库被删除，替换将丢失
- 定期备份 `data/javinizer.db`，或运行 `javinizer genre export`

---

**下一步**：[数据库架构](./06-database-schema.zh.md)
