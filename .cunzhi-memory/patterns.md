# 常用模式和最佳实践

- 实现了混合节点匹配算法hybrid-node-matcher.ts，包含：1.中心点距离+重叠面积比例的混合匹配(权重0.4:0.6) 2.基于左侧/上方相邻节点的偏移量修正机制 3.父节点边界检查避免跨级匹配 4.从左上到右下的节点处理顺序 5.置信度阈值和加成机制。解决了前端List渲染导致的DOM与设计稿节点位置差异问题。
- UI差异检测算法优化模式：当多个DOM节点匹配到同一个design节点时，使用加权差距计算选择最佳匹配。权重配置：margin各维度0.2，width/height各0.1。算法分两步：1)按design节点分组收集候选匹配 2)选择加权差距最小的DOM节点，过滤其他候选。包含详细日志输出便于调试。
- MasterGo插件使用viteSingleFile时，全局变量**DEV**需要用JSON.stringify()包装才能正确注入。修改：**DEV**: JSON.stringify(process.env.NODE_ENV === 'development')。这是因为viteSingleFile插件在处理单文件内联时对define配置的特殊要求。
- Chrome插件UI Differ项目代码重构模式：将复杂的文件处理和上传逻辑从组件方法中抽离到独立的工具函数中。创建了resultUploader.ts工具文件，封装JSON文件生成、上传和错误处理逻辑，返回CDN URL。组件方法保持简洁，专注于数据组装和用户交互。这种模式提高了代码的可维护性、可复用性和可测试性。
- 用户在 processOverFlowHidden 函数重构中展现的优秀代码设计模式：

## 核心设计原则

### 1. 单一职责分解

- 将复杂功能拆分为职责单一的小函数
- getLastestClipConstraint：专门获取裁剪约束
- processNodeWithClipConstraint：专门处理节点和递归
- 每个函数都有明确的输入输出，便于理解和测试

### 2. 数据流线性化

- 获取约束 → 判断条件 → 应用变更 → 递归处理
- 每步都用语义化变量承载结果：newClipConstraint、shouldChangeSize、newNodeInfo
- 避免复杂的嵌套逻辑和链式调用

### 3. 边界条件前置处理

- 优先处理特殊情况：无子节点、GROUP类型、无clipsContent
- 使用 early return 减少嵌套层级
- 边界处理完善但不冗余

### 4. 条件判断语义化

- 用布尔变量表达复杂条件：shouldChangeSize = newClipConstraint && (newClipConstraint.width < width || newClipConstraint.height < height)
- 避免在 if 语句中直接写复杂表达式
- 让代码自解释业务逻辑

### 5. 数据处理简化

- 解构赋值提取属性，避免复杂对象构造
- 展开运算符合并对象：{...node, ...newClipConstraint}
- 只在真正需要时创建新对象，提升性能

### 6. 类型系统充分利用

- Pick<FrameNode, 'width' | 'height' | ...> 复用现有类型
- 减少 as any 类型断言
- 利用 TypeScript 类型推导能力

## 实践要点

- 简洁性优于复杂性：能用简单方法解决就不用复杂方案
- 可读性优于性能：在保证功能的前提下，优先考虑代码可读性
- 函数拆分优于注释：通过合理的函数命名和拆分表达逻辑，而不是依赖注释
- 类型安全优于灵活性：充分利用 TypeScript 类型系统保证代码质量
