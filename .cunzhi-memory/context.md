# 项目上下文信息

- UI Differ Monorepo 项目初始化情况：

项目结构：
- 根目录：使用pnpm工作空间管理，统一ESLint配置(@antfu/eslint-config)
- Chrome插件(packages/plugin-chrome)：React 19 + TypeScript + Vite + CRXJS，Manifest V3规范，支持popup/content script/side panel
- MasterGo插件(packages/plugin-master-go)：React 17 + TypeScript + Vite，支持canvas/devMode编辑器，具备inspect能力

技术栈：
- 包管理：pnpm + workspace
- 构建工具：Vite
- 前端框架：React
- 语言：TypeScript严格模式
- 代码质量：ESLint + 强制AI代码生成标识规范

开发配置：
- 统一构建系统，支持热重载
- 文件行数限制<1000行
- Chrome插件自动打包zip
- MasterGo插件UI与主体分离通信

运行命令：pnpm dev/build/clean
