# 项目结构说明

## 目录结构

```
web-debugger/
├── .github/
│   └── workflows/           # GitHub Actions 工作流
│       ├── build.yml        # 构建和发布工作流
│       └── ci.yml           # 持续集成工作流
├── src/                     # 源代码目录
│   ├── config/              # 配置模块
│   │   └── index.ts         # 全局配置（主题、尺寸等）
│   ├── interceptor/         # 拦截器模块
│   │   └── index.ts         # Fetch/XHR/WebSocket 拦截逻辑
│   ├── types/               # 类型定义
│   │   └── index.ts         # TypeScript 接口和类型
│   ├── ui/                  # UI 管理模块
│   │   └── index.ts         # 面板、样式、交互逻辑
│   ├── utils/               # 工具函数
│   │   └── index.ts         # JSON 格式化、时间等工具
│   └── index.ts             # 入口文件，初始化逻辑
├── scripts/                 # 构建脚本
│   └── build.js             # esbuild 构建配置
├── dist/                    # 构建输出（自动生成）
│   └── web-debugger.user.js # 最终的用户脚本
├── .eslintrc.js            # ESLint 配置
├── .gitignore              # Git 忽略文件
├── .prettierrc.json        # Prettier 配置
├── package.json            # 项目配置和依赖
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目文档
```

## 模块说明

### config/index.ts
定义全局配置常量，包括：
- 最大日志数量
- 面板尺寸
- 主题颜色

### interceptor/index.ts
实现网络请求拦截功能：
- XHR 拦截：劫持 XMLHttpRequest
- Fetch 拦截：劫持 window.fetch
- WebSocket 拦截：劫持 WebSocket 连接

### types/index.ts
TypeScript 类型定义：
- LogData：日志数据结构
- Theme：主题配置类型
- Config：配置类型
- XHRContext：XHR 上下文类型

### ui/index.ts
UI 管理模块：
- 样式注入
- 元素创建
- 事件绑定
- 拖拽功能
- 日志显示

### utils/index.ts
工具函数：
- formatJSON：JSON 格式化
- getTime：获取时间戳
- safeClone：安全克隆对象

### index.ts
入口文件：
- 初始化检查
- DOM 观察器
- 模块启动

## 构建流程

1. TypeScript 编译检查
2. ESLint 代码检查
3. esbuild 打包
4. 添加 UserScript 头部
5. 输出到 dist/web-debugger.user.js

## CI/CD 流程

### CI 工作流 (ci.yml)
- 类型检查
- 代码检查
- 格式检查
- 构建测试

### Build 工作流 (build.yml)
- 运行所有检查
- 构建生产版本
- 创建 GitHub Release
- 上传构建产物
