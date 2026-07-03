# CLI 参考

Javinizer Go 的完整命令行界面参考。

## 全局标志

这些标志在根命令上可用，并被所有子命令继承：

```bash
--config string   # 配置文件路径（默认 "configs/config.yaml"）
--verbose, -v     # 启用调试日志
--help, -h        # 显示帮助
--version         # 显示版本并退出（仅根命令）
```

## 命令

### `init`

初始化 Javinizer 配置和数据库。

```bash
javinizer init
```

创建 `configs/` 目录、生成默认 `config.yaml`、创建 `data/` 目录、初始化 SQLite 数据库、运行数据库迁移。

### `scrape`

刮削特定 JAV ID 的元数据。

```bash
javinizer scrape <ID> [flags]
```

**标志：**
```bash
-s, --scrapers strings       # 使用的刮削器子集（如 'r18dev,dmm'）
-f, --force                  # 强制从刮削器刷新元数据
    --actress-db             # 启用演员数据库查询
    --genre-replacement      # 启用类型替换
    --browser                # 启用 DMM 浏览器模式
```

**示例：**
```bash
javinizer scrape IPX-535
javinizer scrape IPX-535 --scrapers r18dev,dmm
javinizer scrape IPX-535 --force
```

### `sort`

扫描、刮削和整理视频文件。

```bash
javinizer sort <path> [flags]
```

**标志：**
```bash
-d, --dest string        # 目标目录（默认：与源相同）
    --download           # 下载媒体文件（默认 true）
-n, --dry-run            # 预览而不实际更改
-m, --move               # 移动文件而非复制
    --link-mode string   # 链接模式：none, hard, soft
    --nfo                # 生成 NFO 文件（默认 true）
-r, --recursive          # 递归扫描子目录（默认 true）
-p, --scrapers strings   # 刮削器优先级覆盖
```

**示例：**
```bash
# 预演
javinizer sort ~/Videos --dry-run

# 实际整理
javinizer sort ~/Videos

# 移动文件到指定目录
javinizer sort ~/Videos --move --dest ~/Organized
```

### `update`

更新已整理文件的元数据。

```bash
javinizer update <path> [flags]
```

### `tui`

启动交互式终端用户界面。

```bash
javinizer tui <path> [flags]
```

### `actress`

管理演员数据库。

```bash
javinizer actress list                    # 列出所有演员
javinizer actress search <name>           # 搜索演员
javinizer actress add <名> <姓>           # 添加演员
javinizer actress merge --target <id> --source <id>  # 合并演员
javinizer actress export [file.json]      # 导出演员数据
javinizer actress import <file.json>      # 导入演员数据
```

### `genre`

管理类型替换。

```bash
javinizer genre add <原始> <替换>      # 添加类型替换
javinizer genre list                     # 列出所有替换
javinizer genre remove <原始>            # 删除替换
javinizer genre export [file.json]      # 导出替换
javinizer genre import <file.json>      # 导入替换
```

### `tag`

管理影片标签。

```bash
javinizer tag add <ID> <tag> [tags...]    # 为影片添加标签
javinizer tag search <term>               # 搜索标签
javinizer tag list [ID]                   # 列出影片的标签
```

### `token`

管理 API 令牌。

```bash
javinizer token create                    # 创建新令牌
javinizer token list                      # 列出所有令牌
javinizer token revoke <id>               # 撤销令牌
```

### `word`

管理单词替换。

```bash
javinizer word add <原始> <替换>         # 添加单词替换
javinizer word list                       # 列出所有替换
javinizer word remove <原始>              # 删除替换
javinizer word export [file.json]        # 导出替换
javinizer word import <file.json>        # 导入替换
```

### `logs`

查看日志。

```bash
javinizer logs list                       # 列出日志文件
javinizer logs tail                       # 追踪日志输出
```

### `history`

查看和还原操作历史。

```bash
javinizer history list                    # 列出历史记录
javinizer history undo <id>               # 撤销操作
```

### `config`

管理配置。

```bash
javinizer config migrate                  # 迁移配置到最新版本
javinizer config validate                 # 验证配置文件
```

### `version`

显示版本信息。

```bash
javinizer version                         # 显示版本
javinizer version --check                 # 检查更新
```

### `info`

显示配置和系统信息。

```bash
javinizer info                            # 显示配置、刮削器和数据库状态
```

### `completion`

生成 shell 补全脚本。

```bash
javinizer completion bash                 # 生成 Bash 补全
javinizer completion zsh                  # 生成 Zsh 补全
javinizer completion powershell           # 生成 PowerShell 补全
```

### `upgrade`

自我升级。

```bash
javinizer upgrade                         # 下载、验证并替换当前二进制
javinizer upgrade --check                 # 仅检查是否有更新
javinizer upgrade --force                 # 即使已是最新也重新安装
javinizer upgrade --prerelease            # 升级到预发布版本
```

## 常用工作流

### 首次设置
```bash
javinizer init
javinizer web
```

### 整理整个库
```bash
javinizer sort ~/Videos
```

### 清理和重新组织
```bash
javinizer update ~/Organized --force
```

---

**下一步**：[模板系统](./04-template-system.zh.md)
