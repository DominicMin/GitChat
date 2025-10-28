# GitChat 技术文档

> 完整的、模块化的技术文档集合

---

## 📚 文档概览

本文档集详细描述了 GitChat 项目的架构、数据结构、开发流程和 API 设计。

---

## 📖 文档目录

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构文档
**适合人群**: 所有开发者、架构师

**内容**:
- 🏗️ 系统架构图
- 💾 Content Graph 存储机制（重点）
- 🧩 核心模块详解
- 🔄 数据流分析
- 🌐 API 设计
- 🛠️ 技术栈

**亮点**: 
- 详细说明 Content Graph 如何在 React State 中存储
- 完整的数据流图解
- Node 和 Edge 的存储结构

---

### 2. [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - 数据结构详解
**适合人群**: 前端开发者、后端开发者

**内容**:
- 📦 Node 数据结构（UserInputNode、LLMResponseNode）
- 🔗 Edge 数据结构（CustomEdge）
- 📜 ConversationHistory 结构
- 💾 存储位置和机制
- 📊 数据量估算
- 🔄 数据转换流程

**亮点**:
- TypeScript 类型定义
- 实际 JSON 示例
- 分支和合并的数据结构
- 内存占用计算

---

### 3. [COMPONENTS_API.md](./COMPONENTS_API.md) - 组件 API 文档
**适合人群**: 前端开发者

**内容**:
- 🧩 NodeChat 主组件 API
- 📝 UserInputNode 组件 API
- 💬 LLMResponseNode 组件 API
- 🔗 CustomEdge 组件 API
- 🛠️ Utility Functions（工具函数）
- 🎨 样式常量
- 🐛 常见问题

**亮点**:
- 完整的 Props 和 State 定义
- 方法签名和示例代码
- Markdown 渲染配置
- 第三方库集成说明

---

### 4. [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南
**适合人群**: 新贡献者、开发者

**内容**:
- 🛠️ 开发环境设置
- 📁 项目结构
- 🔄 开发工作流
- 🐛 调试技巧
- 🧪 测试指南
- 📝 代码风格
- 🤝 贡献指南

**亮点**:
- 从零开始的环境搭建
- 常见开发场景的操作指南
- 前后端调试技巧
- PR 流程和模板

---

## 🚀 快速导航

### 我想了解...

| 问题 | 推荐文档 | 章节 |
|-----|---------|------|
| **Content Graph 如何存储？** | [ARCHITECTURE.md](./ARCHITECTURE.md#content-graph-存储机制) | § 2 |
| **Node 的数据结构是什么？** | [DATA_STRUCTURES.md](./DATA_STRUCTURES.md#节点类型) | § 2 |
| **如何添加新的节点类型？** | [DEVELOPMENT.md](./DEVELOPMENT.md#前端开发) | § 3.2 |
| **NodeChat 组件有哪些方法？** | [COMPONENTS_API.md](./COMPONENTS_API.md#nodechat---主应用组件) | § 1 |
| **如何构建上下文历史？** | [ARCHITECTURE.md](./ARCHITECTURE.md#上下文树构建) | § 2.3 |
| **数据流是怎样的？** | [ARCHITECTURE.md](./ARCHITECTURE.md#数据流) | § 4 |
| **如何搭建开发环境？** | [DEVELOPMENT.md](./DEVELOPMENT.md#开发环境设置) | § 1 |
| **如何调试流式响应？** | [DEVELOPMENT.md](./DEVELOPMENT.md#frontend-调试) | § 4 |
| **Node/Edge 的内存占用？** | [DATA_STRUCTURES.md](./DATA_STRUCTURES.md#数据量估算) | § 6 |
| **如何提交 PR？** | [DEVELOPMENT.md](./DEVELOPMENT.md#贡献指南) | § 6 |

---

## 🎯 按角色推荐阅读顺序

### 前端开发者

1. ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) - 了解整体架构
2. ✅ [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - 熟悉数据结构
3. ✅ [COMPONENTS_API.md](./COMPONENTS_API.md) - 学习组件 API
4. ✅ [DEVELOPMENT.md](./DEVELOPMENT.md) - 开始开发

### 后端开发者

1. ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) - 了解整体架构
2. ✅ [ARCHITECTURE.md § API 设计](./ARCHITECTURE.md#api-设计) - 学习 API
3. ✅ [DATA_STRUCTURES.md § 上下文历史](./DATA_STRUCTURES.md#上下文历史) - 理解数据格式
4. ✅ [DEVELOPMENT.md](./DEVELOPMENT.md) - 开始开发

### 新贡献者

1. ✅ [DEVELOPMENT.md § 快速开始](./DEVELOPMENT.md#开发环境设置) - 环境搭建
2. ✅ [ARCHITECTURE.md § 架构概览](./ARCHITECTURE.md#架构概览) - 了解系统
3. ✅ [DEVELOPMENT.md § 开发工作流](./DEVELOPMENT.md#开发工作流) - 学习流程
4. ✅ [DEVELOPMENT.md § 贡献指南](./DEVELOPMENT.md#贡献指南) - 提交代码

### 架构师/技术负责人

1. ✅ [ARCHITECTURE.md](./ARCHITECTURE.md) - 完整阅读
2. ✅ [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - 完整阅读
3. ✅ [../ROADMAP.md](../ROADMAP.md) - 了解规划

---

## 📊 文档统计

| 文档 | 页数 | 章节数 | 代码示例 |
|-----|------|--------|----------|
| ARCHITECTURE.md | ~15 | 9 | 20+ |
| DATA_STRUCTURES.md | ~20 | 7 | 30+ |
| COMPONENTS_API.md | ~18 | 5 | 25+ |
| DEVELOPMENT.md | ~12 | 6 | 15+ |
| **总计** | **~65** | **27** | **90+** |

---

## 🔄 文档更新日志

### v1.0 - 2025-10-28
- ✅ 创建完整的技术文档
- ✅ 详细说明 Content Graph 存储机制
- ✅ 提供组件 API 参考
- ✅ 编写开发指南

---

## 🤝 文档贡献

发现文档问题或有改进建议？

1. **提交 Issue**: [GitHub Issues](https://github.com/DrustZ/GitChat/issues)
2. **提 PR**: 直接修改文档并提交 Pull Request
3. **讨论**: [GitHub Discussions](https://github.com/DrustZ/GitChat/discussions)

---

## 📚 相关资源

### 外部文档

- [React 官方文档](https://react.dev/)
- [ReactFlow 文档](https://reactflow.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [OpenAI API 文档](https://platform.openai.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### 项目文档

- [README.md](../readme.md) - 项目介绍和快速开始
- [ROADMAP.md](../ROADMAP.md) - 功能路线图
- [System Prompt](../server/llm-branched-conversation-prompt.md) - LLM 系统提示词

---

## 💡 文档使用技巧

### 1. 搜索功能

在 GitHub 上查看文档时，使用 `Ctrl+F` (Windows) 或 `Cmd+F` (Mac) 快速查找关键词。

### 2. 目录导航

每个文档开头都有目录，点击可以快速跳转到对应章节。

### 3. 代码示例

所有代码示例都可以直接复制使用。带有注释的代码块说明了关键逻辑。

### 4. 交叉引用

文档之间有大量交叉引用，点击链接可以跳转到相关章节。

---

## 🎓 学习路径建议

### 初学者（1-2 天）

**目标**: 了解项目，能够运行和修改

1. 阅读 [README.md](../readme.md) - 30 分钟
2. 跟随 [DEVELOPMENT.md § 快速开始](./DEVELOPMENT.md#开发环境设置) 搭建环境 - 1 小时
3. 阅读 [ARCHITECTURE.md § 架构概览](./ARCHITECTURE.md#架构概览) - 1 小时
4. 实践：创建节点、发送消息、编辑内容 - 2 小时
5. 阅读 [DEVELOPMENT.md § 开发工作流](./DEVELOPMENT.md#开发工作流) - 1 小时

### 进阶开发者（3-5 天）

**目标**: 深入理解，能够开发新功能

1. 完整阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) - 2 小时
2. 完整阅读 [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - 2 小时
3. 完整阅读 [COMPONENTS_API.md](./COMPONENTS_API.md) - 2 小时
4. 实践：添加自定义节点类型 - 4 小时
5. 实践：修改上下文构建逻辑 - 4 小时
6. 阅读 [ROADMAP.md](../ROADMAP.md) 了解未来规划 - 1 小时

### 高级贡献者（1-2 周）

**目标**: 精通架构，能够主导大型功能开发

1. 深入研究所有文档
2. 阅读完整源代码
3. 实践：实现 MCP 集成（参考 ROADMAP）
4. 优化性能和架构
5. 编写测试用例
6. 参与代码审查

---

## 📞 获取帮助

遇到问题？

1. **查阅文档**: 先搜索相关文档
2. **查看 Issues**: [GitHub Issues](https://github.com/DrustZ/GitChat/issues)
3. **提问讨论**: [GitHub Discussions](https://github.com/DrustZ/GitChat/discussions)
4. **联系维护者**: 通过 GitHub 留言

---

**文档维护者**: GitChat Team  
**最后更新**: 2025-10-28  
**文档版本**: v1.0

