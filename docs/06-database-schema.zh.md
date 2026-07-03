# 数据库架构

Javinizer Go 使用 SQLite 缓存刮削的电影元数据，存储演员和类型信息，管理替换/翻译表，记录操作历史和批处理作业，发出结构化事件，以及认证 API 令牌。架构由版本化迁移在启动时自动创建和演进。

## 数据库位置

**默认**：`data/javinizer.db`

在 `configs/config.yaml` 中配置：

```yaml
database:
  type: sqlite
  dsn: data/javinizer.db
  log_level: silent
```

数据库路径也可以通过 `JAVINIZER_DB` 环境变量覆盖。

## 表结构

架构包含 18 个表。主键是 `content_id`（规范化后的内容 ID，例如 `ipx00535`）；`id` 是原始 JAV ID（例如 `IPX-535`），作为普通索引列存储。

### 核心元数据

#### movies

| 列 | 类型 | 描述 |
|--------|------|-------------|
| content_id | TEXT | **主键**。规范化内容 ID |
| id | TEXT | 原始 JAV ID |
| title | TEXT | 影片标题 |
| original_title | TEXT | 日文/原始语言标题 |
| description | TEXT | 剧情描述 |
| release_date | DATETIME | 发布日期 |
| runtime | INTEGER | 时长（分钟） |
| director | TEXT | 导演 |
| maker | TEXT | 制作商 |
| label | TEXT | 标签 |
| series | TEXT | 系列名称 |
| poster_url | TEXT | 海报 URL |
| cover_url | TEXT | 封面 URL |
| ... | ... | ...（详见源码迁移） |

#### actresses

存储演员信息，包含 `dmm_id` 部分唯一索引，无 DMM ID 的演员可共存。

#### genres

存储唯一类型名称。

### 关联表

- **movie_actresses**：影片与演员的多对多关系
- **movie_genres**：影片与类型的多对多关系
- **movie_tags**：用户为影片添加的标签

### 替换、别名和 ID 映射

- **genre_replacements**：用户定义的类型名称替换
- **word_replacements**：用户定义的单词替换
- **actress_aliases**：演员别名到规范名称的映射
- **content_id_mappings**：搜索 ID 到规范化 content_id 的缓存

### 翻译表

- **movie_translations**：影片字段的多语言翻译
- **genre_translations**：类型名称的多语言翻译
- **actress_translations**：演员名称的多语言翻译

### 操作、作业和事件

- **history**：影片操作的追加日志
- **jobs**：批处理作业
- **batch_file_operations**：批处理中每个文件的详细信息
- **events**：结构化事件日志

### 认证

- **api_tokens**：用于认证 REST/WebSocket 请求的 API 令牌

## 关系图

```
核心元数据
  movies (PK: content_id) ─┬─ (1:N) movie_actresses (N:1) ── actresses
                            ├─ (1:N) movie_genres     (N:1) ── genres
                            ├─ (1:N) movie_translations
                            └─ (logical) movie_tags

替换/别名/映射
  genre_replacements、word_replacements、actress_aliases、content_id_mappings

翻译
  genres (1:N) genre_translations、actresses (1:N) actress_translations

操作/作业/事件
  jobs (PK: id) ─┬─ (1:N) batch_file_operations
                 └─ (1:N) history
  events（独立）

认证
  api_tokens（独立）
```

## 常用查询

```sql
-- 查看所有影片
SELECT content_id, id, title, release_date, maker FROM movies ORDER BY release_date DESC;

-- 按演员查询影片
SELECT m.content_id, m.id, m.title FROM movies m
JOIN movie_actresses ma ON m.content_id = ma.movie_content_id
JOIN actresses a ON ma.actress_id = a.id
WHERE a.japanese_name = '名称'
ORDER BY m.release_date DESC;

-- 类型替换
SELECT original, replacement FROM genre_replacements ORDER BY original;
```

## 备份与恢复

```bash
# 备份
cp data/javinizer.db data/javinizer.db.backup

# 还原
cp data/javinizer.db.backup data/javinizer.db

# 导出 SQL
sqlite3 data/javinizer.db .dump > javinizer-export.sql
```

## 维护

```bash
# 检查大小
ls -lh data/javinizer.db

# 压缩数据库
sqlite3 data/javinizer.db "VACUUM;"
```

## 迁移

数据库迁移在启动时自动执行，使用嵌入在二进制中的版本化 Goose 迁移。迁移在正常应用启动前应用。如果迁移失败，启动会中止并显示包含备份路径和恢复命令的错误信息。

## 直接访问

### 使用 sqlite3 CLI

```bash
sqlite3 data/javinizer.db
.tables
.schema movies
SELECT * FROM movies LIMIT 5;
.quit
```

### 使用 GUI 工具

- **DB Browser for SQLite**：https://sqlitebrowser.org/
- **DBeaver**：https://dbeaver.io/

---

**返回**：[入门指南](./01-getting-started.zh.md)
