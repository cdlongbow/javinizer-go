# Javinizer Go 入门指南

Javinizer Go 是一款现代高性能元数据刮削和文件整理工具。本指南将帮助您快速上手。

## 目录

- [功能概览](#功能概览)
- [前置要求](#前置要求)
- [安装](#安装)
- [初始设置](#初始设置)
- [首次刮削](#首次刮削)
- [首次整理操作](#首次整理操作)
- [后续步骤](#后续步骤)
- [快速提示](#快速提示)
- [常见设置问题](#常见设置问题)
- [获取帮助](#获取帮助)

## 功能概览

### 多源刮削
- R18.dev 刮削器（快速 JSON API）
- DMM/Fanza 刮削器（HTML 解析 + 浏览器模式）
- 其他可选刮削器（JavDB、JavLibrary、LibreDMM 等）
- 可配置的元数据优先级和聚合
- 数据库缓存，快速重复查询

### 文件整理
- 从文件名自动检测 JAV ID
- 基于模板的文件夹/文件命名
- 嵌套子文件夹层级
- 移动/复制操作，带冲突处理
- 预演（dry-run）预览模式

### 元数据和媒体
- Kodi/Plex 兼容的 NFO 生成
- 演员数据库支持
- 类型替换系统
- 封面、海报、剧照、预告片和演员图片下载

### 界面
- CLI 命令
- 交互式 TUI 工作流
- API 服务器 + Web 前端

## 安装

### Homebrew（macOS / Linux）

```bash
brew tap javinizer/homebrew-tap https://github.com/javinizer/homebrew-tap
brew trust --formula javinizer/tap/javinizer
brew install javinizer
```

### Scoop（Windows）

```powershell
scoop bucket add javinizer https://github.com/javinizer/scoop-javinizer
scoop install javinizer
```

### 一键安装

**Linux / macOS：**
```bash
curl -sSL https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.sh | bash
```

**Windows（PowerShell）：**
```powershell
irm https://raw.githubusercontent.com/javinizer/javinizer-go/main/scripts/install.ps1 | iex
```

### 预编译二进制

从 [GitHub Releases](https://github.com/javinizer/javinizer-go/releases) 下载对应平台的二进制文件。

### Docker

```bash
mkdir -p ./data
curl -o ./data/config.yaml https://raw.githubusercontent.com/javinizer/javinizer-go/main/configs/config.yaml.example

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -p 8080:8080 \
  -v "$(pwd)/data:/javinizer" \
  -v "/path/to/your/media:/media" \
  ghcr.io/javinizer/javinizer-go:latest
```

### 从源码构建

需要 Go 1.26+ 和 CGO（用于 SQLite）。嵌入式 Web UI 还需要 Node.js 20+。

```bash
git clone https://github.com/javinizer/javinizer-go.git
cd javinizer-go
make build
./bin/javinizer version
```

## 初始设置

### 1. 初始化 Javinizer

```bash
javinizer init
```

这将创建默认配置文件 `configs/config.yaml` 和 SQLite 数据库 `data/javinizer.db`。

### 2. 验证配置

```bash
javinizer info
```

### 3. 完成首次 Web 认证

```bash
javinizer web
```

打开 http://localhost:8080 创建默认用户名/密码。

## 首次刮削

```bash
javinizer scrape IPX-535
```

元数据现在已缓存在本地数据库中。后续对同一 ID 的刮削将瞬间完成！

## 首次整理操作

### 预演（预览）

```bash
javinizer sort ~/javinizer-test --dry-run
```

### 应用更改

```bash
javinizer sort ~/javinizer-test
```

### 排序选项

```bash
# 禁用递归扫描
javinizer sort ~/Videos --recursive=false

# 移动文件而非复制
javinizer sort ~/Videos --move

# 指定输出目标
javinizer sort ~/Videos --dest ~/Organized

# 跳过 NFO 生成
javinizer sort ~/Videos --nfo=false

# 跳过媒体下载
javinizer sort ~/Videos --download=false
```

## 后续步骤

### 自定义设置
1. **配置优先级**：选择每个字段偏好的刮削源
2. **模板系统**：自定义文件夹和文件命名格式
3. **类型管理**：替换类型名称以匹配偏好

### 高级用法
- CLI 参考：完整命令文档
- 数据库架构：直接数据库查询和管理
- 故障排除：常见问题及解决方案

## 常见设置问题

### 端口 8080 已被占用
```bash
javinizer web --port 3000
```

### 权限被拒绝
```bash
chmod +x javinizer
```

### Docker 容器权限问题
在 `.env` 中设置 `PUID` 和 `PGID` 匹配主机用户。

### 刮削器 Cookie 错误
配置 FlareSolverr 处理 Cloudflare 保护的站点：

```yaml
scrapers:
  flaresolverr:
    enabled: true
    url: "http://localhost:8191/v1"
```

## 获取帮助

- **内置帮助**：`javinizer <command> --help`
- **配置信息**：`javinizer info`
- **GitHub Issues**：报告问题或请求功能

---

**下一步**：[配置指南](./02-configuration.zh.md)
