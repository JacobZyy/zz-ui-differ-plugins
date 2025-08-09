# 开发规范和规则

- UI Differ Monorepo 统一配置改动记录：

版本统一：
1. React版本统一到18.x：
   - MasterGo插件从17.0.2升级到18.3.1
   - Chrome插件保持19.1.0（更新版本）

2. Vite版本统一到7.x：
   - MasterGo插件从2.8.4升级到7.0.5
   - Chrome插件保持7.0.5

3. TypeScript配置统一：
   - 根目录tsconfig.json合并两个项目的配置
   - Chrome插件采用三层配置模式：tsconfig.json -> tsconfig.app.json/tsconfig.node.json
   - MasterGo插件继承根配置，保留项目特有配置（paths、types等）
   - 所有子项目通过extends继承根配置

4. 包管理统一：
   - MasterGo插件脚本从yarn改为pnpm
   - TypeScript版本统一到5.8.3

配置原则：保持Chrome插件的现代化配置为基准，MasterGo插件向其靠拢但保留必要的特殊配置。
- vite-plugin-singlefile插件更新记录：

版本更新：
- 从0.6.3升级到2.3.0（最新版本）

配置优化：
1. 插件配置更新：
   - useRecommendedBuildConfig: true (自动调整vite配置)
   - removeViteModuleLoader: true (移除未使用的模块加载器)  
   - deleteInlinedFiles: true (删除内联后的文件)

2. 构建配置简化：
   - 移除了冲突的rollup配置项（inlineDynamicImports、manualChunks等）
   - 新版本插件会自动处理资源内联配置
   - 保持target: "esnext"以支持现代浏览器

3. 条件化应用插件：
   - 只在TARGET=ui时启用singlefile插件
   - 避免在构建main.js时应用单文件配置

构建结果：
- 成功生成143KB的单文件index.html（gzip: 46KB）
- 所有JS和CSS资源正确内联到HTML文件中
- 构建时间显著改善（270ms）

参考文档：https://www.npmjs.com/package/vite-plugin-singlefile
- MasterGo插件构建输出配置改动记录：

构建产物输出调整：
1. 输出目录修改：
   - 从本地./dist调整到根目录../../dist/plugin-ui-differ-master-go
   - 所有构建产物统一输出到根目录的dist文件夹下

2. 自定义插件开发：
   - 创建copyManifestPlugin自定义vite插件
   - 自动复制manifest.json到输出目录
   - 自动更新manifest.json中的文件路径：
     * main: "dist/main.js" → "main.js"  
     * ui: "dist/index.html" → "index.html"

3. 构建脚本优化：
   - 移除build脚本中的"rm -rf ./dist/assets"
   - 新增clean脚本：rm -rf ../../dist/plugin-ui-differ-master-go

构建产物结构：
- 根目录/dist/plugin-ui-differ-master-go/
  * index.html (143KB单文件，包含所有资源)
  * main.js (253字节UMD模块)
  * manifest.json (更新后的路径配置)

技术实现：
- vite.config.ts的outDir配置
- 自定义writeBundle钩子处理manifest文件
- 保持原有的单文件构建配置不变
- Chrome插件构建输出配置改动记录：

构建产物输出调整：
1. 输出目录修改：
   - build.outDir配置：path.resolve(__dirname, '../../dist/plugin-chrome')
   - 所有构建产物统一输出到根目录的dist文件夹下

2. Zip打包配置优化：
   - inDir: 指向新的输出目录 ../../dist/plugin-chrome
   - outDir: 根目录 ../../dist
   - outFileName: plugin-chrome-${version}.zip
   - 自动生成可直接安装的Chrome插件zip包

3. 构建脚本优化：
   - 新增clean脚本：rm -rf ../../dist/plugin-chrome ../../dist/plugin-chrome-*.zip
   - 移除未使用的name导入，修复TypeScript检查

构建产物结构：
- 根目录/dist/plugin-chrome/ (完整的Chrome插件文件结构)
  * manifest.json (Manifest V3配置)
  * assets/ (JS/CSS资源文件)
  * src/popup/index.html (弹窗页面)
  * src/sidepanel/index.html (侧边栏页面)
  * public/logo.png (插件图标)
  * .vite/ (构建元数据)
- 根目录/dist/plugin-chrome-1.0.0.zip (71KB可安装包)

技术实现：
- CRXJS插件自动处理Chrome扩展构建
- vite-plugin-zip-pack自动打包
- 保持原有的热重载开发体验
