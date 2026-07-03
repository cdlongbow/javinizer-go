# 模板系统

Javinizer Go 使用灵活的模板系统自定义文件夹和文件名。本指南涵盖所有可用标签、修饰符和示例。

## 模板语法

模板使用尖括号 `<TAG>` 插入动态数据：

```
<ID> - <TITLE> (<YEAR>)
```

结果：
```
IPX-535 - Beautiful Day (2020)
```

### 带修饰符

在冒号后添加修饰符：

```
<ID:lower>
```

结果：
```
ipx-535
```

## 可用标签

### 基本信息

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<ID>` | JAV ID | `IPX-535` |
| `<CONTENTID>` | 内容 ID（小写，无连字符） | `ipx00535` |
| `<TITLE>` | 影片标题 | `Beautiful Day` |
| `<ORIGINALTITLE>` | 日文/备选标题 | `美しい日` |

### 制作信息

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<STUDIO>` 或 `<MAKER>` | 制作商名称 | `Idea Pocket` |
| `<LABEL>` | 标签名称 | `IP Label` |
| `<SERIES>` 或 `<SET>` | 系列名称 | `Tsubomi Series` |
| `<DIRECTOR>` | 导演名称 | `John Director` |

### 日期和时间

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<YEAR>` | 发布年份（4 位） | `2020` |
| `<RELEASEDATE>` | 完整发布日期 | `2020-09-13` |
| `<RELEASEDATE:format>` | 自定义日期格式 | 见下文 |
| `<RUNTIME>` | 时长（分钟） | `120` |

### 演员

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<ACTRESSES>` 或 `<ACTORS>` | 所有演员 | `Sakura Momo, Mikami Yua` |
| `<ACTRESS>` | 第一个演员名称 | `Sakura Momo` |
| `<FIRSTNAME>` | 第一个演员的名 | `Momo` |
| `<LASTNAME>` | 第一个演员的姓 | `Sakura` |

### 类别

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<GENRES>` | 所有类型（逗号分隔） | `Solowork, Beautiful Girl` |
| `<GENRES:delimiter>` | 自定义分隔符 | `Solowork & Beautiful Girl` |

### 元数据

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<DESCRIPTION>` | 描述/剧情 | `长篇描述文字...` |
| `<RATING>` | 评分（一位小数） | `7.5` |
| `<RESOLUTION>` | 视频分辨率 | `1080p` |
| `<FILENAME>` | 原始文件名（无扩展名） | `IPX-535` |

### 多部分

| 标签 | 描述 | 示例 |
|-----|-------------|---------|
| `<PART>` 或 `<DISC>` | 部分/碟片编号 | `1`, `2` |
| `<PARTSUFFIX>` | 部分后缀 | `-cd1` |
| `<MULTIPART>` | 是否为多部分文件 | `true`/空 |

## 修饰符

在冒号后添加修饰符：`<TAG:modifier>`

### 大小写修饰符（仅支持 `<ID>` 和 `<CONTENTID>`）

| 修饰符 | 描述 | 示例 |
|----------|-------------|--------|
| `:upper` | 转大写 | `<CONTENTID:upper>` → `IPX00535` |
| `:lower` | 转小写 | `<ID:lower>` → `ipx-535` |

### 日期修饰符

| 修饰符 | 描述 | 示例 |
|----------|-------------|---------|
| (无) | 默认格式 | `2020-09-13` |
| `:YYYY-MM-DD` | ISO 格式 | `2020-09-13` |
| `:YYYY/MM/DD` | 斜杠分隔 | `2020/09/13` |
| `:MM-DD-YYYY` | 美国格式 | `09-13-2020` |
| `:DD.MM.YYYY` | 欧洲格式 | `13.09.2020` |
| `:YYYYMMDD` | 紧凑格式 | `20200913` |

### 语言修饰符

用于支持多语言的标签（`TITLE`、`MAKER`、`SERIES` 等）：

| 修饰符 | 描述 | 示例 |
|----------|-------------|--------|
| `:EN` | 英文 | `<TITLE:EN>` |
| `:JA` | 日文 | `<TITLE:JA>` |
| `:JA\|EN` | 日文，英文备选 | `<TITLE:JA\|EN>` |

**示例：**
```yaml
output:
  folder_format: "<ID> [<MAKER:JA>] - <TITLE:EN> (<YEAR>)"
```
结果：`ROYD-191 [ROYD] - A Beautiful Day (2024)`

### 演员标签修饰符

| 修饰符 | 描述 | 示例 |
|----------|-------------|--------|
| `:FIRST` | 西方姓名顺序（名在前） | `<ACTORS:FIRST>` |
| `:LAST` | 日本姓名顺序（姓在前，默认） | `<ACTORS:LAST>` |
| `:JA` | 优先使用日文名 | `<ACTORS:JA>` |
| `:EN` | 优先使用拉丁名 | `<ACTORS:EN>` |
| `:DELIM=\|` | 自定义分隔符 | `<ACTORS:DELIM=\|>` |
| `:SORT` | 按字母排序 | `<ACTORS:SORT>` |

组合示例：`<ACTORS:FIRST:EN:DELIM= |>`

## 条件逻辑

使用 `<IF>` 标签基于条件包含内容：

| 标签 | 描述 |
|-----|-------------|
| `<IF:MULTIPART>内容</IF>` | 仅多部分文件时包含内容 |
| `<IF:ACTRESSES>内容</IF>` | 有演员信息时包含内容 |

**示例：**
```
<ID><IF:MULTIPART>-pt<PART></IF>
```
结果：`IPX-535`（单文件）或 `IPX-535-pt1`（多部分文件）

## 示例

### 按制作商和年份组织
```yaml
output:
  folder_format: "<MAKER>/<YEAR>/<ID> - <TITLE>"
```
结果：`Idea Pocket/2020/IPX-535 - Beautiful Day/`

### 演员名称为目录名
```yaml
output:
  folder_format: "<ACTORS>/<ID> - <TITLE>"
```
结果：`Sakura Momo/IPX-535 - Beautiful Day/`

### 多部分文件
```yaml
output:
  file_format: "<ID><IF:MULTIPART>-pt<PART></IF>"
```
结果：`IPX-535.mp4` 或 `IPX-535-pt1.mp4`

### 自定义 NFO 文件名
```yaml
metadata:
  nfo:
    filename_template: "<ID>.nfo"
```

## 特殊字符

文件名中不允许的字符会自动替换为 `_`：
- `/` → `_`
- `\` → `_`
- `:` → `_`
- `*` → `_`
- `?` → `_`
- `"` → `_`
- `<` → `_`
- `>` → `_`
- `|` → `_`

---

**下一步**：[类型管理](./05-genre-management.zh.md)
