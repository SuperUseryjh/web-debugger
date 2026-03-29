# Web Debugger

现代化网络请求调试助手，使用 TypeScript 编写，支持 Fetch/XHR/WebSocket 深度监控。

~~好吧其实只是因为Chrome调试不了WebSocket，所以一怒之下写的~~

## 功能特性

- 🎯 **现代化 UI 设计** - 采用深色主题，简洁易用
- 🔍 **全面拦截** - 支持 Fetch、XHR、WebSocket 请求监控
- 📊 **详细信息** - 显示请求/响应头、载荷、状态码等
- 🎨 **可拖拽面板** - 面板可自由拖动，支持最小化
- ⚡ **高性能** - 使用 esbuild 构建，体积小，速度快

## 项目结构

```
web-debugger/
├── src/
│   ├── config/          # 配置文件
│   ├── interceptor/     # 请求拦截器
│   ├── types/           # TypeScript 类型定义
│   ├── ui/              # UI 管理模块
│   ├── utils/           # 工具函数
│   └── index.ts         # 入口文件
├── scripts/
│   └── build.js         # 构建脚本
├── .github/
│   └── workflows/       # GitHub Actions 工作流
├── dist/                # 构建输出目录
└── package.json
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## 自动化工作流

### CI 工作流

每次提交或 Pull Request 都会触发 CI 检查：

- 类型检查
- 代码检查
- 格式检查
- 构建测试

### Build & Release 工作流

推送到 `main` 或 `master` 分支时：

1. 运行所有检查
2. 构建生产版本
3. 创建 GitHub Release
4. 上传构建产物

## 构建产物

构建完成后，在 `dist/` 目录下生成：

- `web-debugger.user.js` - 用户脚本文件

## 安装使用

1. 安装 Tampermonkey 或其他用户脚本管理器
2. 下载 `dist/web-debugger.user.js`
3. 在脚本管理器中安装脚本
4. 刷新页面即可看到调试面板

## 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **esbuild** - 超快的 JavaScript 打包工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **GitHub Actions** - 自动化 CI/CD

## License

GNU GPL v3
