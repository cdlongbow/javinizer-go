# 故障排除

Javinizer Go 的常见问题和解决方案。

## 安装问题

### "javinizer: command not found"

**问题**：二进制文件不在 PATH 中

**解决方案**：
```bash
# 选项 1：移动到 PATH 目录
sudo mv javinizer /usr/local/bin/

# 选项 2：使用完整路径运行
/path/to/javinizer --help

# 选项 3：将目录添加到 PATH
export PATH=$PATH:/path/to/directory
```

### "Permission denied"

**问题**：二进制文件没有执行权限

**解决方案**：
```bash
chmod +x javinizer
```

## 配置问题

### "Config file not found"

**问题**：缺少 `config.yaml`

**解决方案**：
```bash
# 初始化配置
javinizer init

# 或指定自定义位置
javinizer --config /path/to/config.yaml scrape IPX-535
```

### "Invalid configuration"

**问题**：YAML 格式错误

**解决方案**：
- 检查 YAML 语法（缩进、冒号、引号）
- 使用在线 YAML 验证器验证
- 与默认配置对比
- 运行 `javinizer info` 查看解析后的配置

## 数据库问题

### "Database locked"

**问题**：多个实例同时访问数据库

**解决方案**：
```bash
# 关闭其他 Javinizer 进程
killall javinizer

# 或等待操作完成
# 或删除锁文件
rm data/javinizer.db-wal
rm data/javinizer.db-shm
```

### "No such table"

**问题**：数据库未初始化或未迁移

**解决方案**：
```bash
# 重新初始化数据库
rm data/javinizer.db
javinizer init
```

### "Database is corrupt"

**问题**：SQLite 数据库损坏

**解决方案**：
```bash
# 选项 1：删除并重新初始化
rm data/javinizer.db
javinizer init

# 选项 2：尝试修复
sqlite3 data/javinizer.db "PRAGMA integrity_check;"
sqlite3 data/javinizer.db ".recover" | sqlite3 data/javinizer-recovered.db
```

> **注意：** 数据库路径默认为 `data/javinizer.db`（通过 `config.yaml` 中的 `database.dsn` 设置，或由 `JAVINIZER_DB` 环境变量覆盖）。如果你自定义了路径，请调整上述命令中的路径。

## 抓取问题

### "Failed to scrape: timeout"

**问题**：网络超时或连接缓慢

**解决方案**：
- 检查你的互联网连接
- 稍后重试（网站可能宕机或响应缓慢）
- 使用不同的抓取器：`javinizer scrape IPX-535 --scrapers dmm`
- 增加 `config.yaml` 中的抓取超时时间（无需重新构建）：

```yaml
scrapers:
  timeout_seconds: 60          # 每次请求的 HTTP 客户端超时 (1–300, 默认 30)
  request_timeout_seconds: 120 # 整体请求超时 (1–600, 默认 60)
  browser:
    timeout: 60                # 浏览器模式页面超时 (默认 30)
```

### "404 Not Found"

**问题**：影片 ID 在抓取器上不存在

**解决方案**：
- 验证 ID 是否正确
- 尝试不同的抓取器
- 手动检查网站是否存在该影片
- 某些 ID 仅在特定抓取器上可用

### "No scrapers returned data"

**问题**：所有抓取器都失败了

**解决方案**：
```bash
# 检查抓取器配置
javinizer info

# 在 config.yaml 中启用抓取器
scrapers:
  r18dev:
    enabled: true
  dmm:
    enabled: true

# 单独测试每个抓取器
javinizer scrape IPX-535 --scrapers r18dev
javinizer scrape IPX-535 --scrapers dmm
```

### "Rate limited"

**问题**：向抓取器发送了太多请求

**解决方案**：
- 等待几分钟后重试
- 降低 `config.yaml` 中的并发数（`performance.max_workers`，默认 5，范围 1–100）
- 以毫秒为单位添加每个抓取器的延迟（例如 `scrapers.r18dev.rate_limit`；r18dev 默认为 0（无延迟））
- 将批量操作分散到不同时间

## 文件匹配问题

### "No files found"

**问题**：扫描器未找到任何视频文件

**解决方案**：
```bash
# 检查路径是否存在
ls -la /path/to/videos

# 验证配置文件扩展名（默认值：.mp4、.mkv、.avi、.wmv、.flv）
file_matching:
  extensions: [.mp4, .mkv, .avi, .wmv, .flv]

# 检查排除模式（默认值：*-trailer*、*-sample*）
file_matching:
  exclude_patterns: ["*-trailer*", "*-sample*"]

# 小于 min_size_mb 的文件会被跳过（0 = 无限制）
file_matching:
  min_size_mb: 0

# 递归扫描默认开启，因此 --recursive 很少是解决方案。
# 要仅扫描顶级目录，请显式禁用它：
javinizer sort /path --recursive=false
```

### "ID not detected"

**问题**：匹配器无法从文件名中提取 JAV ID

**解决方案**：
- 确保文件名包含 JAV ID（例如 `IPX-535`）
- 如果启用了自定义正则表达式，请检查
- 重命名文件以清晰包含 ID
- 禁用自定义正则表达式以使用内置模式

**好的文件名示例**：
```
IPX-535.mp4
IPX-535 Beautiful Day.mkv
[Studio] IPX-535.avi
```

**不好的文件名示例**：
```
movie.mp4
download (1).mkv
video_file.avi
```

## 组织问题

### "File already exists"

**问题**：目标文件与现有文件冲突

**解决方案**：
- 使用 `--dry-run` 预览
- 手动解决冲突
- 使用不同的目标目录
- 检查是否已处理过此文件

### "Permission denied"（移动/复制时）

**问题**：权限不足

**解决方案**：
```bash
# 检查权限
ls -la /destination/path

# 修复权限
chmod 755 /destination/path

# 使用适当的用户运行
sudo javinizer sort /path
```

对于 Docker/Unraid 部署：
- 确保容器使用匹配的 ID 运行（`PUID`/`PGID`，或旧的 `USER_ID`/`GROUP_ID`）
- 在 Unraid 上，常见值为 `PUID=99` 和 `PGID=100`

### "Path too long"

**问题**：文件路径超出操作系统限制（Windows：260 字符）

**解决方案**：
- 简化模板格式
- 移除 `<TITLE>` 等长字段
- 使用更短的目标路径
- 降低 `config.yaml` 中的路径/标题长度限制：`output.max_path_length`（默认 240）和 `output.max_title_length`（默认 100）
- 在 Windows 上：在注册表中启用长路径

## NFO 生成问题

### "Invalid XML"

**问题**：生成的 NFO 不是有效的 XML

**解决方案**：
- 检查元数据中的特殊字符
- 提供影片 ID 报告问题
- 必要时手动编辑 NFO

### "NFO not recognized by Kodi/Plex"

**问题**：媒体服务器无法解析 NFO

**解决方案**：
- 验证 NFO 文件名与视频文件匹配
- 检查 NFO 是否与视频在同一目录中
- 验证 XML 结构
- 检查媒体服务器日志

## 下载问题

### "Failed to download cover"

**问题**：图片下载失败

**解决方案**：
- 检查你的互联网连接
- 验证图片 URL 是否可访问（可能受区域限制，或位于需要 `scrapers.referer`/代理的 CDN 后）
- 检查可用磁盘空间
- 确认在 `config.yaml` 中启用了下载（`output.download_cover`、`output.download_poster`），并在下载超时时提高 `output.download_timeout`（默认 60s）
- 重试操作

### "Downloaded file is corrupt"

**问题**：下载不完整或损坏

**解决方案**：
```bash
# 删除部分下载的文件
rm /path/to/corrupt/file

# 重试下载
javinizer sort /path
```

## 模板问题

### "Template not rendering"

**问题**：模板标签未被替换为值

**解决方案**：
- 检查标签语法：`<TAG>` 而不是 `{TAG}` 或 `[TAG]`
- 验证标签名称是否正确——标签不区分大小写（`<TITLE>`、`<title>` 和 `<Title>` 都有效）；请参阅完整的[标签参考](./04-template-system.zh.md#可用标签)
- 检查该字段是否确实有数据：`javinizer scrape IPX-535`
- 检查 `config.yaml` 中的模板：

```yaml
output:
  folder_format: "<ID> - <TITLE> (<YEAR>)"
  file_format: "<ID>"
```

### "Special characters in filenames"

**问题**：输出中出现不需要的字符

**解决方案**：
- 这是自动清理（预期行为）
- 请参阅[模板指南](./04-template-system.zh.md#特殊字符)
- `:`、`?`、`*` 等字符会自动替换

## 性能问题

### "Slow scraping"

**问题**：元数据获取耗时过长

**解决方案**：
- 重用数据库缓存——已抓取的 ID 不会重新获取，除非传递了 `--force`（`scrape`）或 `--force-refresh`（`sort`）
- 仅启用需要的抓取器：在 `config.yaml` 中精简 `scrapers.priority`，或每次运行时传递子集 `--scrapers r18dev,dmm`
- 检查你的网络连接和代理/FlareSolverr 设置（受 Cloudflare 保护的站点需要 FlareSolverr）
- 考虑抓取器可靠性（R18.dev 通常比浏览器驱动的抓取器更快）

### "High memory usage"

**问题**：Javinizer 使用过多 RAM

**解决方案**：
- 处理较小的批次（扫描较小的目录）
- 降低 `config.yaml` 中的并发数（`performance.max_workers`，默认 5），以便同时运行的抓取更少
- 如果数据库缓存已变得非常大，请清除它
- 提供详细信息报告问题

## 类别替换问题

### "Replacement not applied"

**问题**：类别仍显示原始名称

**解决方案**：
```bash
# 验证替换是否存在
javinizer genre list

# 检查精确拼写（区分大小写）
javinizer genre add "Exact Original" "Replacement"

# 重新抓取以应用
javinizer scrape IPX-535
```

## 调试模式

启用详细日志记录：

```yaml
# config.yaml
logging:
  level: debug
  format: text
  output: stdout
```

然后运行命令，将输出捕获到文件（当日志设置为 `output: stdout` 时，日志输出到 `stdout`，因此需要重定向两个流）：
```bash
javinizer sort /path --dry-run 2>&1 | tee debug.log
```

## 获取帮助

1. **查看文档**：查阅相关指南
2. **搜索问题**：https://github.com/javinizer/javinizer-go/issues
3. **启用调试日志**：捕获详细输出
4. **创建 Issue**：提供以下信息：
   - Javinizer 版本
   - 操作系统
   - 使用的命令
   - 错误信息
   - 调试日志（如适用）

## 常见错误信息

### "no such file or directory"

- 检查路径是否存在
- 使用绝对路径
- 验证权限

### "invalid argument"

- 检查命令语法
- 验证标志值
- 对包含空格的路径使用引号

### "context deadline exceeded"

- 网络/抓取器超时——请求超过了配置的限制
- 提高 `config.yaml` 中的抓取超时时间（`scrapers.timeout_seconds`、`scrapers.request_timeout_seconds`）并重试
- 检查你的互联网连接和代理/FlareSolverr 可用性

### "database schema mismatch"

- 删除数据库：`rm data/javinizer.db`
- 重新初始化：`javinizer init`

---

**返回**：[入门指南](./01-getting-started.zh.md)