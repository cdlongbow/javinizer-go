# API 参考

Javinizer REST API 提供对元数据刮削、文件组织和数据库操作的编程访问。API 驱动 Web UI，并附带完整的交互式文档。

## 概述

- **基础 URL**：`http://localhost:8080/api/v1`
- **内容类型**：`application/json`
- **认证**：内置单用户会话认证
- **WebSocket**：`/ws/progress` 提供实时进度更新

## 快速开始

### 启动 API 服务器

**使用 Docker（推荐）：**
```bash
docker run --rm -p 8080:8080 \
  -v "$(pwd)/data:/javinizer" \
  -v "/path/to/media:/media" \
  ghcr.io/javinizer/javinizer-go:latest
```

**使用 CLI：**
```bash
javinizer api
```

### 交互式 API 文档

API 服务器提供两个交互式文档界面：
- **Scalar UI**：http://localhost:8080/docs
- **Swagger UI**：http://localhost:8080/swagger/index.html

### 首次运行认证设置

首次启动时，受保护的 API 路由在配置凭证前返回 `503`。

1. 启动服务器：`javinizer api`
2. 打开 Web UI：http://localhost:8080/
3. 在设置界面创建用户名/密码
4. 设置后自动颁发会话 Cookie

## API 端点

### 影片

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `POST` | `/api/v1/scrape` | 刮削 JAV ID 的元数据 |
| `GET` | `/api/v1/movies` | 列出数据库中所有影片 |
| `GET` | `/api/v1/movies/:id` | 按 ID 获取影片元数据 |
| `POST` | `/api/v1/movies/:id/rescrape` | 强制重新刮削影片 |

### 演员

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/actresses` | 列出所有演员 |
| `GET` | `/api/v1/actresses/search` | 按名称搜索演员 |
| `POST` | `/api/v1/actresses` | 创建新演员条目 |
| `PUT` | `/api/v1/actresses/:id` | 更新演员元数据 |
| `DELETE` | `/api/v1/actresses/:id` | 删除演员 |
| `POST` | `/api/v1/actresses/merge` | 合并演员 |
| `GET` | `/api/v1/actresses/export` | 导出演员数据库 |
| `POST` | `/api/v1/actresses/import` | 导入演员 |

### 批处理操作

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `POST` | `/api/v1/batch/scrape` | 启动批处理刮削作业 |
| `GET` | `/api/v1/batch/:id` | 获取批处理作业状态 |
| `DELETE` | `/api/v1/batch/:id` | 删除批处理作业 |
| `POST` | `/api/v1/batch/:id/cancel` | 取消运行中的批处理作业 |
| `POST` | `/api/v1/batch/:id/organize` | 组织已完成批处理的文件 |

### 作业（历史/还原）

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/jobs` | 列出批处理作业 |
| `GET` | `/api/v1/jobs/:id` | 获取单个批处理作业 |
| `POST` | `/api/v1/jobs/:id/revert` | 还原批处理作业 |

### 文件操作

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/cwd` | 获取当前工作目录 |
| `POST` | `/api/v1/scan` | 扫描目录中的 JAV 文件 |
| `POST` | `/api/v1/browse` | 浏览文件系统 |

### 系统

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/auth/status` | 获取认证状态 |
| `POST` | `/api/v1/auth/setup` | 首次设置（创建用户名/密码） |
| `POST` | `/api/v1/auth/login` | 登录并创建会话 Cookie |
| `GET` | `/api/v1/config` | 获取当前配置 |
| `PUT` | `/api/v1/config` | 更新配置 |
| `GET` | `/api/v1/scrapers` | 列出可用刮削源 |

### 类型与单词

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/genres` | 列出数据库中的所有类型 |
| `GET` | `/api/v1/genres/replacements` | 列出类型替换 |
| `POST` | `/api/v1/genres/replacements` | 创建类型替换 |
| `PUT` | `/api/v1/genres/replacements` | 更新类型替换 |
| `DELETE` | `/api/v1/genres/replacements` | 删除类型替换 |

### 令牌

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/api/v1/tokens` | 列出活跃 API 令牌 |
| `POST` | `/api/v1/tokens` | 创建新 API 令牌 |
| `DELETE` | `/api/v1/tokens/:id` | 撤销 API 令牌 |

### 其他端点

| 方法 | 端点 | 描述 |
|--------|----------|-------------|
| `GET` | `/health` | 健康检查端点 |
| `GET` | `/ws/progress` | WebSocket 实时进度更新 |
| `GET` | `/docs` | Scalar 交互式 API 文档 |

## WebSocket

`/ws/progress` 端点为批处理操作提供实时进度更新。需要已认证的会话 Cookie。

**连接 WebSocket：**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/progress');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Progress:', update);
};
```

## CORS 配置

API 包含用于浏览器前端应用的 CORS 中间件。在 `config.yaml` 中配置：

```yaml
api:
  security:
    allowed_origins: ["*"]
```

## 目录安全

文件操作受 `allowed_directories` 配置限制。空的 `allowed_directories` = 全部拒绝（默认安全）。

## 错误响应

标准错误格式：
```json
{
  "error": "Not Found",
  "message": "The requested resource does not exist",
  "path": "/api/v1/movies/INVALID-ID",
  "method": "GET"
}
```

---

**下一步**：[迁移指南](./08-migration-guide.zh.md)
