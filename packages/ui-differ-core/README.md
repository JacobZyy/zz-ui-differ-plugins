# @ui-differ/core

UI Differ Core Algorithm Library

## 简介

这是一个纯TypeScript函数库，提供UI差异分析的核心算法。主要用于比较两个UI元素、组件或结构之间的差异。

## 功能特性

- 🧮 UI差异计算
- 🔍 属性比较分析
- 🏗️ 结构变化分析
- 📊 差异报告生成

## 安装

```bash
pnpm add @ui-differ/core
```

## 使用方法

```typescript
import {
  analyzeStructureChange,
  calculateUIDifference,
  compareProps,
  generateDifferenceReport
} from '@ui-differ/core'

// 计算UI差异
const diff = calculateUIDifference(element1, element2)

// 比较属性
const propsDiff = compareProps(props1, props2)

// 分析结构变化
const structureDiff = analyzeStructureChange(structure1, structure2)

// 生成报告
const report = generateDifferenceReport(diff)
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 清理
pnpm clean
```

## 构建产物

构建后的文件位于 `dist/` 目录：

- `index.js` - CommonJS格式
- `index.mjs` - ES Module格式
- `index.d.ts` - TypeScript类型定义
- `index.d.ts.map` - 类型定义源码映射

## 许可证

ISC
