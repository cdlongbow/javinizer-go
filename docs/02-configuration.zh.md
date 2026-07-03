# 配置指南

Javinizer Go 使用位于 `configs/config.yaml` 的 YAML 配置文件。本指南详细介绍所有配置选项。

## 配置文件位置

默认路径为 `configs/config.yaml`。可使用 `--config` 指定自定义位置：

```bash
javinizer --config /path/to/custom/config.yaml scrape IPX-535
```

生成新配置文件：
```bash
javinizer init
```

## 服务器设置

```yaml
server:
  host: localhost  # 绑定地址
  port: 8080       # 监听端口
```

### API 安全设置

```yaml
api:
  security:
    allowed_directories:
      - /media
      - ~/Videos
    denied_directories:
      - /etc
      - /root
    max_files_per_scan: 10000
    scan_timeout_seconds: 30
    allowed_origins:
      - "http://localhost:5173"
    allow_unc: false
    allowed_unc_servers: []
```

**allowed_directories**：API 可以访问的路径。空数组 = 全部拒绝（默认安全）。

**denied_directories**：额外的阻止路径（内置阻止列表包括 `/proc`、`/sys`、`/dev`）。

**allowed_origins**：CORS 允许的来源。`["*"]` 允许所有来源（仅开发环境）。

**allow_unc**：（仅 Windows）允许 UNC 路径。默认 `false` 以保证安全。

## 刮削器配置

Javinizer 支持多个元数据刮削器，可启用/禁用并设置优先级。

```yaml
scrapers:
  user_agent: ""
  priority:
    - r18dev
    - libredmm
    - dmm
    - javlibrary
    - javdb
    - javbus
    - jav321
    - mgstage
    - tokyohot
    - aventertainment
    - caribbeancom
    - dlgetchu
    - fc2
    - javstash
  proxy:
    enabled: false
    default_profile: "main"
    profiles:
      main:
        url: ""
        username: ""
        password: ""
      backup:
        url: ""
        username: ""
        password: ""
```

**priority**：刮削器查询顺序。先尝试第一个，失败则尝试下一个。

**proxy**：全局 HTTP/SOCKS5 代理。支持多个可配置的连接配置集。

### R18.dev 刮削器

默认启用，提供快速 JSON API：

```yaml
scrapers:
  r18dev:
    enabled: true
```

**优点**：快速、可靠、元数据完整、包含演员信息。

### DMM/Fanza 刮削器

```yaml
scrapers:
  dmm:
    enabled: false
    use_browser: true
```

**优点**：官方来源、发布日期准确、描述详细。
**缺点**：较慢（HTML 解析）。

### JavLibrary 刮削器

```yaml
scrapers:
  javlibrary:
    enabled: false
    language: "ja"
    base_url: "http://www.javlibrary.com"
    use_flaresolverr: false
```

### JavDB 刮削器

```yaml
scrapers:
  javdb:
    enabled: false
    base_url: "https://javdb.com"
    use_flaresolverr: false
```

## 元数据优先级

当多个刮削器返回结果时，控制每个字段使用哪个刮削器的数据。

```yaml
metadata:
  priority:
    title:
      - r18dev
      - dmm
```

### 每字段优先级语义

- **有关键字且有刮削器列表**（如 `series: [tokyohot]`）：仅列出的刮削器填充该字段
- **关键字缺失**：继承全局 `scrapers.priority` 列表
- **关键字为空列表**（`series: []`）：继承全局列表
- **跳过一个字段**：使用 `__skip__` 哨兵值（如 `series: ["__skip__"]`）

### 默认逐字段优先级

默认配置中大多数字段优先使用 DMM，只有竖版海报（`poster_url`）优先使用 R18.dev。

```yaml
metadata:
  priority:
    title:
      - dmm
      - r18dev
    description:
      - dmm
      - r18dev
    poster_url:
      - r18dev
      - libredmm
      - dmm
    cover_url:
      - dmm
      - r18dev
```

## NFO 设置

配置 Kodi/Plex 兼容的 NFO 文件生成：

```yaml
metadata:
  nfo:
    enabled: true
    display_title: <TITLE>
    filename_template: <ID>.nfo
    first_name_order: true
    actress_language_ja: false
    unknown_actress_mode: skip
    include_fanart: true
    include_trailer: true
    tag: []
```

## 文件匹配

配置 Javinizer 如何识别 JAV 文件并提取 ID：

```yaml
file_matching:
  extensions:
    - .mp4
    - .mkv
    - .avi
  min_size_mb: 0
  exclude_patterns:
    - '*-trailer*'
    - '*-sample*'
  regex_enabled: false
  regex_pattern: ([a-zA-Z|tT28]+-\d+[zZ]?[eE]?)(?:-pt)?(\d{1,2})?
```

## 输出格式

```yaml
output:
  folder_format: "<ID> [<STUDIO>] - <TITLE> (<YEAR>)"
  file_format: "<ID><IF:MULTIPART>-pt<PART></IF>"
  subfolder_format: []
  download_cover: true
  download_poster: true
  download_extrafanart: false
  download_trailer: false
  download_actress: false
```

### 嵌套子文件夹示例

按年份组织：
```yaml
subfolder_format: ["<YEAR>"]
```
结果：`dest/2020/IPX-535 [Idea Pocket] - <title> (2020)/IPX-535.mp4`

按年份和制作商组织：
```yaml
subfolder_format: ["<YEAR>", "<STUDIO>"]
```
结果：`dest/2020/Idea Pocket/IPX-535 [Idea Pocket] - <title> (2020)/IPX-535.mp4`

## 数据库配置

```yaml
database:
  type: sqlite
  dsn: data/javinizer.db
  log_level: silent
```

## 日志记录

```yaml
logging:
  level: info
  format: text
  output: stdout
  max_size_mb: 100
  max_backups: 30
  max_age_days: 30
  compress: true
```

---

**下一步**：[CLI 参考](./03-cli-reference.zh.md)
