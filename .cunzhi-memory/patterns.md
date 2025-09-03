# 常用模式和最佳实践

- 实现了混合节点匹配算法hybrid-node-matcher.ts，包含：1.中心点距离+重叠面积比例的混合匹配(权重0.4:0.6) 2.基于左侧/上方相邻节点的偏移量修正机制 3.父节点边界检查避免跨级匹配 4.从左上到右下的节点处理顺序 5.置信度阈值和加成机制。解决了前端List渲染导致的DOM与设计稿节点位置差异问题。
- UI差异检测算法优化模式：当多个DOM节点匹配到同一个design节点时，使用加权差距计算选择最佳匹配。权重配置：margin各维度0.2，width/height各0.1。算法分两步：1)按design节点分组收集候选匹配 2)选择加权差距最小的DOM节点，过滤其他候选。包含详细日志输出便于调试。
- MasterGo插件使用viteSingleFile时，全局变量**DEV**需要用JSON.stringify()包装才能正确注入。修改：**DEV**: JSON.stringify(process.env.NODE_ENV === 'development')。这是因为viteSingleFile插件在处理单文件内联时对define配置的特殊要求。
- Chrome插件UI Differ项目代码重构模式：将复杂的文件处理和上传逻辑从组件方法中抽离到独立的工具函数中。创建了resultUploader.ts工具文件，封装JSON文件生成、上传和错误处理逻辑，返回CDN URL。组件方法保持简洁，专注于数据组装和用户交互。这种模式提高了代码的可维护性、可复用性和可测试性。
