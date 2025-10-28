# GitChat 技术架构文档

> **版本**: v1.0  
> **最后更新**: 2025-10-28  
> **维护者**: GitChat Team

---

## 📚 目录

1. [架构概览](#架构概览)
2. [Content Graph 存储机制](#content-graph-存储机制)
3. [核心模块](#核心模块)
4. [数据流](#数据流)
5. [API 设计](#api-设计)
6. [技术栈](#技术栈)

---

## 🏗️ 架构概览

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ NodeChat.js  │  │ UserInput    │  │ LLMResponse  │   │
│  │ (Main App)   │  │ Node         │  │ Node         │   │
│  └──────┬───────┘  └──────────────┘  └──────────────┘   │
│         │                                               │
│         │ Uses ReactFlow                                │
│         ↓                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │        Content Graph (In-Memory State)          │    │
│  │  - nodes: Node[]    (useNodesState)             │    │
│  │  - edges: Edge[]    (useEdgesState)             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└───────────────────────┬───────────────────────────────  ┘
                        │ HTTP/SSE
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)             │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ server.js    │  │ OpenAI SDK   │  │ System       │  │
│  │              │→ │              │→ │ Prompt       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└───────────────────────┬───────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────────┐
│              LLM API (OpenAI Compatible)                 │
│  - OpenAI API                                            │
│  - Azure OpenAI                                          │
│  - OpenRouter                                            │
│  - Local LLMs (Ollama, LM Studio)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Content Graph 存储机制

### 核心数据结构

GitChat 使用 **ReactFlow** 管理 Content Graph，数据完全存储在**前端内存**中（React State）。

#### 1. Node 数据结构

```typescript
interface Node {
  id: string;                    // 唯一标识符，格式: "userInput-{timestamp}" 或 "llmResponse-{timestamp}"
  type: 'userInput' | 'llmResponse';  // 节点类型
  position: {                    // 画布上的位置坐标
    x: number;
    y: number;
  };
  data: {                        // 节点内容
    text: string;                // 消息内容
  };
  selected?: boolean;            // 是否被选中
}
```

**实际示例**：
```javascript
{
  id: "userInput-1698765432000",
  type: "userInput",
  position: { x: 100, y: 200 },
  data: { text: "如何实现登录功能？" },
  selected: false
}
```

#### 2. Edge 数据结构

```typescript
interface Edge {
  id: string;                    // 唯一标识符，格式: "e{sourceId}-{targetId}-{timestamp}"
  source: string;                // 源节点 ID
  target: string;                // 目标节点 ID
  type: 'custom';                // 边的类型（使用自定义边组件）
  data: {
    onEdgeClick: (edgeId: string) => void;  // 点击边的回调函数
  };
}
```

**实际示例**：
```javascript
{
  id: "euserInput-1698765432000-llmResponse-1698765435000-1698765435100",
  source: "userInput-1698765432000",
  target: "llmResponse-1698765435000",
  type: "custom",
  data: {
    onEdgeClick: (edgeId) => { /* 删除边的逻辑 */ }
  }
}
```

### 存储实现

#### 1. React State 管理

```javascript
// 在 NodeChat.js 中
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

**特点**：
- ✅ **实时响应**：状态变化立即反映到 UI
- ✅ **高性能**：纯内存操作，无 I/O 延迟
- ❌ **易失性**：刷新页面数据丢失
- ❌ **无持久化**：当前版本不支持保存

#### 2. Graph 关系维护

**父子关系**通过 edges 隐式表示：
```javascript
// 查找父节点（incomers）
const incomers = getIncomers({ id: nodeId }, nodes, edges);

// 查找子节点（outgoers）
const outgoers = getOutgoers({ id: nodeId }, nodes, edges);
```

**分支和合并**：
- **分支**：一个节点有多个 outgoers（多条边指向不同节点）
- **合并**：一个节点有多个 incomers（多条边来自不同节点）

```
         ┌─→ Node B (分支1)
Node A ──┤
         └─→ Node C (分支2)

Node D ──┐
         ├─→ Node F (合并)
Node E ──┘
```

#### 3. 上下文树构建

从当前节点向上递归查找所有祖先节点：

```javascript
// Utility.js 中的核心函数
export function getConversationHistory(node, nodes, edges) {
  const history = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function processNode(currentNode) {
    if (!currentNode) return;

    const nodeHistory = {
      id: currentNode.id,
      role: currentNode.type === 'userInput' ? 'user' : 'assistant',
      parent: [],
      content: currentNode.data.text,
      children: []
    };

    // 查找父节点
    const incomers = getIncomers({ id: currentNode.id }, nodes, edges);
    nodeHistory.parent = incomers.map(incomer => incomer.id);

    // 查找子节点（当前节点除外）
    if (node.id !== currentNode.id) {
      const outgoers = getOutgoers({ id: currentNode.id }, nodes, edges);
      nodeHistory.children = outgoers.map(outgoer => outgoer.id);
    }
    
    history.unshift(nodeHistory);

    // 递归处理父节点
    incomers.forEach(incomer => processNode(nodeMap.get(incomer.id)));
  }

  processNode(node);
  return history;
}
```

**输出格式**（发送给 LLM）：
```json
[
  {
    "id": "userInput-1698765432000",
    "role": "user",
    "parent": [],
    "content": "如何实现登录？",
    "children": ["llmResponse-1698765435000"]
  },
  {
    "id": "llmResponse-1698765435000",
    "role": "assistant",
    "parent": ["userInput-1698765432000"],
    "content": "可以使用 JWT...",
    "children": []
  }
]
```

### 内存占用估算

假设一个典型的对话树：
- 100 个节点
- 平均每个节点 500 字符
- 150 条边

**计算**：
```
Nodes: 100 × (100 bytes metadata + 500 bytes text) = 60 KB
Edges: 150 × 200 bytes = 30 KB
总计: ~90 KB
```

**结论**：即使是大型对话树（1000+ 节点），内存占用也仅在 1MB 级别，完全可以接受。

---

## 🧩 核心模块

### 1. NodeChat 组件 (主应用)

**文件**: `nodechat/src/components/NodeChat.js`

**职责**：
- 管理整个对话图的状态（nodes + edges）
- 处理用户交互（添加节点、连接、右键菜单）
- 协调子组件（UserInputNode、LLMResponseNode）
- 与后端通信

**关键方法**：

```javascript
// 添加新节点
const addNode = useCallback((type, sourceNode, offset, text, connectToSource) => {
  // 计算新节点位置
  // 创建节点对象
  // 更新 nodes state
  // 如果需要，创建连接边
});

// 处理消息发送
const handleSendMessage = useCallback(async () => {
  // 1. 创建用户输入节点
  // 2. 创建 LLM 响应节点（空内容）
  // 3. 获取上下文历史
  // 4. 发送请求到后端
  // 5. 流式接收响应并更新节点
});

// 复制节点
const handleReplicate = useCallback(({ props }) => {
  // 复制节点内容和位置
  // 复制上游连接
});
```

### 2. UserInputNode 组件

**文件**: `nodechat/src/components/UserInputNode.js`

**职责**：
- 渲染用户输入节点
- 支持双击编辑
- 折叠/展开长文本
- 触发响应重新生成

**特性**：
- **实时调整大小**：根据内容自动调整节点尺寸
- **级联重新生成**：修改输入后自动重新生成所有后代响应
- **连接点**：顶部（target）和底部（source）

```javascript
// 级联重新生成
const onRegenerate = useCallback(async () => {
  // 1. 获取所有后代节点
  const descendants = findAllDescendants(userNode.id, nodes, edges);
  
  // 2. 对每个 LLM 响应节点重新生成
  for (const descendantId of descendants) {
    if (descendantNode.type === 'llmResponse') {
      await regenerateNode(descendantNode);
    }
  }
});
```

### 3. LLMResponseNode 组件

**文件**: `nodechat/src/components/LLMResponseNode.js`

**职责**：
- 渲染 LLM 响应节点
- Markdown 格式化显示
- 代码语法高亮
- 支持编辑和折叠

**特性**：
- **Markdown 渲染**：使用 `react-markdown` + `remark-gfm`
- **代码高亮**：使用 `react-syntax-highlighter`
- **流式更新**：响应生成时实时更新显示

```javascript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ inline, className, children }) {
      // 代码块高亮渲染
    }
  }}
>
  {text}
</ReactMarkdown>
```

### 4. CustomEdge 组件

**文件**: `nodechat/src/components/CustomEdge.js`

**职责**：
- 渲染连接边（贝塞尔曲线）
- 处理边的点击删除

**实现**：
```javascript
// 使用 ReactFlow 的 getBezierPath 生成曲线路径
const edgePath = getBezierPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
});

// 两层路径：
// 1. 可见路径（显示连接线）
// 2. 透明路径（扩大点击区域）
```

### 5. Utility 模块

**文件**: `nodechat/src/components/Utility.js`

**职责**：
- 上下文历史构建
- 网络请求封装
- 树遍历辅助函数

**核心函数**：

```javascript
// 1. 发送请求（支持流式响应）
export async function sendConversationRequest(endpoint, conversation, onChunkReceived) {
  // Server-Sent Events (SSE) 流式接收
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    // 解析 SSE 数据格式: "data: {...}\n\n"
    // 触发 onChunkReceived 回调
  }
}

// 2. 查找所有后代
export function findAllDescendants(nodeId, nodes, edges) {
  // 递归查找所有子节点和子孙节点
}

// 3. 查找所有祖先
export function findAllPrecedents(nodeId, nodes, edges) {
  // 递归查找所有父节点和祖先节点
}

// 4. 构建对话历史（见上文）
export function getConversationHistory(node, nodes, edges) { ... }
```

---

## 🔄 数据流

### 1. 消息发送流程

```
┌─────────────┐
│ 用户输入    │
│ 并点击发送  │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ handleSendMessage()                     │
│ 1. 创建 UserInputNode                  │
│ 2. 创建空的 LLMResponseNode            │
│ 3. 连接两个节点                        │
└──────┬──────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ getConversationHistory()                │
│ - 从 LLMResponseNode 向上递归          │
│ - 构建完整的祖先链                     │
│ - 包含 parent/children 关系            │
└──────┬──────────────────────────────────┘
       │
       ↓ POST /generate
┌─────────────────────────────────────────┐
│ Backend: server.js                      │
│ 1. 接收对话历史 JSON                   │
│ 2. 添加 System Prompt                  │
│ 3. 调用 OpenAI SDK                     │
│ 4. 流式返回响应 (SSE)                  │
└──────┬──────────────────────────────────┘
       │
       ↓ Stream chunks
┌─────────────────────────────────────────┐
│ onChunkReceived()                       │
│ - 逐字更新 LLMResponseNode 的 text     │
│ - UI 实时显示                          │
└─────────────────────────────────────────┘
```

### 2. 节点编辑流程

```
┌─────────────┐
│ 双击节点    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ setIsEditing(true)                      │
│ - 切换到 textarea 编辑模式             │
└──────┬──────────────────────────────────┘
       │
       ↓ 用户编辑文本
┌─────────────────────────────────────────┐
│ onTextBlur()                            │
│ - 更新 nodes state                      │
│ - 如果是 UserInputNode，触发重新生成   │
└──────┬──────────────────────────────────┘
       │
       ↓ (UserInputNode only)
┌─────────────────────────────────────────┐
│ onRegenerate()                          │
│ - 查找所有后代 LLM 节点                │
│ - 逐个重新生成响应                     │
└─────────────────────────────────────────┘
```

### 3. 分支创建流程

```
┌─────────────┐
│ 右键节点    │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────┐
│ 上下文菜单                              │
│ - Replicate Node（复制节点）           │
│ - Create Connected Node（创建连接节点）│
└──────┬──────────────────────────────────┘
       │
       ↓ Replicate
┌─────────────────────────────────────────┐
│ handleReplicate()                       │
│ 1. 复制节点内容                        │
│ 2. 在旁边创建新节点                    │
│ 3. 复制所有上游连接                    │
│ → 创建新的分支起点                     │
└─────────────────────────────────────────┘
       │
       ↓ Create Connected
┌─────────────────────────────────────────┐
│ handleCreateConnectedNode()             │
│ 1. 根据当前节点类型创建相反类型        │
│ 2. 在下方创建新节点                    │
│ 3. 连接到当前节点                      │
│ → 扩展现有分支                         │
└─────────────────────────────────────────┘
```

---

## 🌐 API 设计

### Backend API

**Base URL**: `http://localhost:8000`

#### 1. POST /generate

**描述**: 生成 LLM 响应（流式）

**请求**:
```json
{
  "conversation": [
    {
      "id": "userInput-xxx",
      "role": "user",
      "parent": [],
      "content": "如何实现登录？",
      "children": ["llmResponse-yyy"]
    },
    {
      "id": "llmResponse-yyy",
      "role": "assistant",
      "parent": ["userInput-xxx"],
      "content": "",
      "children": []
    }
  ]
}
```

**响应** (Server-Sent Events):
```
data: {"content": "可以"}
data: {"content": "使用"}
data: {"content": " JWT"}
...
data: {"content": "[DONE]"}
```

**实现**:
```javascript
app.post("/generate", async (req, res) => {
  const data = req.body;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const stream = await openai.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(data) }
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      res.write(`data: ${JSON.stringify({ 
        content: chunk.choices[0].delta.content 
      })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
  res.end();
});
```

### 配置 API

#### 环境变量

**文件**: `server/.env`

```bash
# 必需
OPENAI_API_KEY=sk-your-api-key

# 可选
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

**支持的 API 提供商**:
- OpenAI (默认)
- Azure OpenAI
- OpenRouter
- 本地 LLM (Ollama, LM Studio)

---

## 🛠️ 技术栈

### Frontend

| 技术 | 版本 | 用途 |
|-----|------|------|
| React | 18.3.1 | UI 框架 |
| @xyflow/react | 12.0.4 | 流程图渲染和交互 |
| react-markdown | 9.0.1 | Markdown 渲染 |
| react-syntax-highlighter | 15.5.0 | 代码语法高亮 |
| react-contexify | 6.0.0 | 右键菜单 |
| Tailwind CSS | 3.4.7 | 样式框架 |

### Backend

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | 14+ | 运行时 |
| Express | 4.19.2 | Web 框架 |
| OpenAI SDK | 4.54.0 | LLM API 客户端 |
| dotenv | 16.4.5 | 环境变量管理 |
| cors | 2.8.5 | 跨域支持 |

### 开发工具

| 工具 | 用途 |
|-----|------|
| concurrently | 同时运行前后端 |
| nodemon | 后端热重载 |
| react-scripts | 前端构建工具 |

---

## 📊 性能特性

### 1. 渲染优化

```javascript
// 使用 React.memo 避免不必要的重渲染
export default memo(UserInputNode);
export default memo(LLMResponseNode);
```

### 2. 流式响应

- **优点**：实时显示 LLM 响应，提升用户体验
- **实现**：Server-Sent Events (SSE)
- **延迟**：几乎无延迟（chunk 接收即显示）

### 3. 虚拟滚动

- ReactFlow 内置虚拟化
- 即使有 1000+ 节点，也能流畅运行

---

## 🔒 安全考虑

### 1. API Key 保护

- ✅ API key 存储在服务器端 `.env`
- ✅ 不暴露给前端
- ✅ `.env` 文件在 `.gitignore` 中

### 2. CORS 配置

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 3. 输入验证

**当前状态**: ⚠️ 未实现
**TODO**: 添加请求验证中间件

---

## 📈 未来扩展

### 1. 持久化存储

**当前**: 内存存储（刷新丢失）  
**计划**: IndexedDB 本地存储

```javascript
// 伪代码
import Dexie from 'dexie';

const db = new Dexie('GitChatDB');
db.version(1).stores({
  contextTrees: 'id, name, nodes, edges, metadata'
});

// 保存
await db.contextTrees.add({
  id: uuid(),
  name: '项目讨论',
  nodes: nodes,
  edges: edges,
  metadata: { createdAt: new Date() }
});
```

### 2. MCP 集成

详见 [ROADMAP.md](../ROADMAP.md)

---

## 🐛 已知限制

1. **无持久化**：刷新页面数据丢失
2. **无协作**：仅支持单用户
3. **无版本控制**：无法回退到历史状态
4. **内存限制**：超大对话树（10000+ 节点）可能卡顿

---

## 📚 相关文档

- [ROADMAP.md](../ROADMAP.md) - 功能路线图
- [README.md](../readme.md) - 快速开始指南
- [System Prompt](../server/llm-branched-conversation-prompt.md) - LLM 提示词

---

**维护者**: GitChat Team  
**问题反馈**: [GitHub Issues](https://github.com/DrustZ/GitChat/issues)

