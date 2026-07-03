# sv

使用 [`sv`](https://github.com/sveltejs/cli) 构建 Svelte 项目所需的一切。

## 创建项目

如果你正在阅读此文档，说明你可能已经完成了这一步。恭喜！

```sh
# 在当前目录创建新项目
npx sv create

# 在 my-app 目录创建新项目
npx sv create my-app
```

## 开发

创建项目并使用 `npm install`（或 `pnpm install`、`yarn`）安装依赖后，启动开发服务器：

```sh
npm run dev

# 或者启动服务器并在新浏览器标签页中打开应用
npm run dev -- --open
```

## 构建

生成生产版本的应用：

```sh
npm run build
```

可以使用 `npm run preview` 预览生产构建版本。

> 部署应用时，可能需要为目标环境安装 [adapter](https://svelte.dev/docs/kit/adapters)。