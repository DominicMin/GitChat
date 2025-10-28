# GitChat 数据结构详解

> **版本**: v1.0  
> **最后更新**: 2025-10-28

---

## 📋 目录

1. [Content Graph 存储](#content-graph-存储)
2. [节点类型](#节点类型)
3. [边类型](#边类型)
4. [上下文历史](#上下文历史)
5. [存储位置](#存储位置)

---

## 🗂️ Content Graph 存储

### 总览

GitChat 的 Content Graph 由两个核心数据结构组成：

```
Content Graph
├── Nodes: Node[]        // 节点数组
└── Edges: Edge[]        // 边数组
```

### 存储机制

**位置**: React State (前端内存)

```javascript
// NodeChat.js
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

**特点**:
- ✅ **内存存储**: 极快的读写速度
- ✅ **响应式**: 状态变化自动触发 UI 更新
- ❌ **易失性**: 页面刷新数据丢失
- ❌ **无持久化**: 不保存到磁盘或数据库

---

## 📦 节点类型

### 1. UserInputNode（用户输入节点）

**TypeScript 定义**:

```typescript
interface UserInputNode {
  id: string;                    // 格式: "userInput-{timestamp}"
  type: 'userInput';             // 固定值
  position: Position;            // 画布坐标
  data: NodeData;                // 节点内容
  selected?: boolean;            // 是否选中
}

interface Position {
  x: number;                     // X 坐标（像素）
  y: number;                     // Y 坐标（像素）
}

interface NodeData {
  text: string;                  // 用户输入的文本内容
}
```

**示例**:

```json
{
  "id": "userInput-1698765432000",
  "type": "userInput",
  "position": {
    "x": 250,
    "y": 100
  },
  "data": {
    "text": "如何实现 JWT 认证？"
  },
  "selected": false
}
```

**生成规则**:
- **ID**: `userInput-` + Unix 时间戳（毫秒）
- **位置**: 
  - 手动创建：视口中心 + 随机偏移（避免重叠）
  - 连接创建：源节点下方 + nodeHeight + 20px
- **初始文本**: 
  - 手动创建："New user input"
  - 发送消息：用户输入的内容

**UI 特性**:
- 背景色：`bg-green-100`
- 边框色：`border-green-200`（未选中）/ `border-green-500`（选中）
- 连接点：顶部（target）+ 底部（source）
- 操作按钮：♻️ 重新生成

### 2. LLMResponseNode（LLM 响应节点）

**TypeScript 定义**:

```typescript
interface LLMResponseNode {
  id: string;                    // 格式: "llmResponse-{timestamp}"
  type: 'llmResponse';           // 固定值
  position: Position;            // 画布坐标
  data: NodeData;                // 节点内容
  selected?: boolean;            // 是否选中
}

// Position 和 NodeData 同上
```

**示例**:

```json
{
  "id": "llmResponse-1698765435000",
  "type": "llmResponse",
  "position": {
    "x": 250,
    "y": 300
  },
  "data": {
    "text": "JWT 认证的实现步骤：\n\n1. 用户登录\n2. 服务器生成 token\n3. 客户端存储 token\n4. 后续请求携带 token"
  },
  "selected": false
}
```

**生成规则**:
- **ID**: `llmResponse-` + Unix 时间戳（毫秒）
- **位置**: UserInput 节点下方 + userNodeHeight + 20px
- **初始文本**: 空字符串 `""`（流式填充）

**UI 特性**:
- 背景色：`bg-blue-100`
- 边框色：`border-blue-200`（未选中）/ `border-blue-500`（选中）
- 连接点：顶部（target）+ 底部（source）
- 渲染：Markdown + 代码高亮
- 默认折叠：内容超过 160px 时可折叠

---

## 🔗 边类型

### CustomEdge（自定义边）

**TypeScript 定义**:

```typescript
interface CustomEdge {
  id: string;                    // 格式: "e{sourceId}-{targetId}-{timestamp}"
  source: string;                // 源节点 ID
  target: string;                // 目标节点 ID
  type: 'custom';                // 固定值
  data: EdgeData;                // 边的数据
}

interface EdgeData {
  onEdgeClick: (edgeId: string) => void;  // 点击边的回调
}
```

**示例**:

```json
{
  "id": "euserInput-1698765432000-llmResponse-1698765435000-1698765435100",
  "source": "userInput-1698765432000",
  "target": "llmResponse-1698765435000",
  "type": "custom",
  "data": {
    "onEdgeClick": "[Function]"
  }
}
```

**生成规则**:
- **ID**: `e` + sourceId + `-` + targetId + `-` + timestamp
- **方向**: 总是从 source → target（单向）
- **样式**: 贝塞尔曲线，灰色 (#bbb)，宽度 3px

**交互**:
- **点击**: 删除该边（断开连接）
- **视觉反馈**: 鼠标悬停时光标变为 pointer

**关系语义**:
```
UserInput → LLMResponse   // 用户提问 → AI 回答
LLMResponse → UserInput   // AI 回答 → 用户追问
UserInput → UserInput     // 编辑后的用户输入 → 新的用户输入
LLMResponse → LLMResponse // （较少见）AI 响应 → AI 追加响应
```

---

## 📜 上下文历史

### ConversationHistory 结构

发送给 LLM 的对话历史格式：

```typescript
interface ConversationHistory {
  id: string;                    // 节点 ID
  role: 'user' | 'assistant';    // 角色
  parent: string[];              // 父节点 ID 数组（支持多父节点）
  content: string;               // 消息内容
  children: string[];            // 子节点 ID 数组（支持多子节点）
}

type ContextTree = ConversationHistory[];
```

**示例**（线性对话）:

```json
[
  {
    "id": "userInput-100",
    "role": "user",
    "parent": [],
    "content": "什么是 JWT？",
    "children": ["llmResponse-101"]
  },
  {
    "id": "llmResponse-101",
    "role": "assistant",
    "parent": ["userInput-100"],
    "content": "JWT 是 JSON Web Token 的缩写...",
    "children": ["userInput-102"]
  },
  {
    "id": "userInput-102",
    "role": "user",
    "parent": ["llmResponse-101"],
    "content": "如何实现？",
    "children": ["llmResponse-103"]
  },
  {
    "id": "llmResponse-103",
    "role": "assistant",
    "parent": ["userInput-102"],
    "content": "实现步骤如下...",
    "children": []
  }
]
```

**示例**（分支对话）:

```json
[
  {
    "id": "userInput-100",
    "role": "user",
    "parent": [],
    "content": "介绍认证方式",
    "children": ["llmResponse-101"]
  },
  {
    "id": "llmResponse-101",
    "role": "assistant",
    "parent": ["userInput-100"],
    "content": "常见的认证方式有 JWT、Session、OAuth...",
    "children": ["userInput-102", "userInput-103"]  // 分支！
  },
  {
    "id": "userInput-102",
    "role": "user",
    "parent": ["llmResponse-101"],
    "content": "详细说说 JWT",
    "children": ["llmResponse-104"]
  },
  {
    "id": "userInput-103",
    "role": "user",
    "parent": ["llmResponse-101"],
    "content": "Session 的优缺点？",
    "children": ["llmResponse-105"]
  }
]
```

**示例**（分支合并）:

```json
[
  // ... 前面的分支 ...
  {
    "id": "llmResponse-104",
    "role": "assistant",
    "parent": ["userInput-102"],
    "content": "JWT 的详细介绍...",
    "children": ["userInput-106"]
  },
  {
    "id": "llmResponse-105",
    "role": "assistant",
    "parent": ["userInput-103"],
    "content": "Session 的优缺点...",
    "children": ["userInput-106"]
  },
  {
    "id": "userInput-106",
    "role": "user",
    "parent": ["llmResponse-104", "llmResponse-105"],  // 合并！
    "content": "综合考虑，哪个更好？",
    "children": []
  }
]
```

### 构建算法

**核心函数**: `getConversationHistory(node, nodes, edges)`

**流程**:

```
1. 从目标节点开始
2. 查找所有父节点（incomers）
3. 递归处理每个父节点
4. 按照访问顺序逆序构建数组
5. 返回完整的祖先链
```

**伪代码**:

```javascript
function getConversationHistory(node, nodes, edges) {
  const history = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  function processNode(currentNode) {
    if (!currentNode) return;
    
    // 构建当前节点的历史记录
    const nodeHistory = {
      id: currentNode.id,
      role: currentNode.type === 'userInput' ? 'user' : 'assistant',
      parent: getIncomers(currentNode).map(n => n.id),
      content: currentNode.data.text,
      children: currentNode.id === node.id 
        ? []  // 目标节点的 children 为空
        : getOutgoers(currentNode).map(n => n.id)
    };
    
    history.unshift(nodeHistory);  // 插入到数组开头
    
    // 递归处理父节点
    getIncomers(currentNode).forEach(parent => {
      processNode(nodeMap.get(parent.id));
    });
  }
  
  processNode(node);
  return history;
}
```

**时间复杂度**: O(N)，其中 N 是从根到目标节点的路径上的节点数

---

## 💾 存储位置

### 1. 前端存储

**位置**: React Component State

```javascript
// NodeChat.js
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

**实现细节**:
- **框架**: ReactFlow 的状态管理 hooks
- **更新**: 不可变更新（Immutable Updates）
- **性能**: 使用 React.memo 优化重渲染

**示例操作**:

```javascript
// 添加节点
setNodes((nds) => [...nds, newNode]);

// 更新节点
setNodes((nds) => nds.map((n) => 
  n.id === nodeId ? { ...n, data: { ...n.data, text: newText } } : n
));

// 删除节点
setNodes((nds) => nds.filter((n) => n.id !== nodeId));

// 添加边
setEdges((eds) => [...eds, newEdge]);

// 删除边
setEdges((eds) => eds.filter((e) => e.id !== edgeId));
```

### 2. 未来计划：持久化存储

**方案**: IndexedDB

```javascript
// 伪代码
import Dexie from 'dexie';

const db = new Dexie('GitChatDB');
db.version(1).stores({
  contextTrees: 'id, name, nodes, edges, metadata'
});

// 保存当前状态
async function saveContext(name) {
  await db.contextTrees.add({
    id: Date.now().toString(),
    name: name,
    nodes: reactFlow.getNodes(),
    edges: reactFlow.getEdges(),
    metadata: {
      createdAt: new Date(),
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  });
}

// 加载保存的上下文
async function loadContext(id) {
  const context = await db.contextTrees.get(id);
  setNodes(context.nodes);
  setEdges(context.edges);
}
```

**优点**:
- ✅ 浏览器原生支持
- ✅ 大容量存储（数百MB）
- ✅ 异步 API，不阻塞 UI
- ✅ 支持索引和查询

---

## 📊 数据量估算

### 典型场景

| 场景 | 节点数 | 边数 | 平均文本长度 | 总大小 |
|-----|-------|------|------------|--------|
| 简单对话 | 10 | 9 | 200 字符 | ~5 KB |
| 中等讨论 | 50 | 60 | 500 字符 | ~50 KB |
| 复杂项目 | 200 | 250 | 800 字符 | ~300 KB |
| 大型知识库 | 1000 | 1500 | 1000 字符 | ~2 MB |

### 内存占用

**节点内存**:
```
Node 对象 ≈ 100 bytes (metadata) + text.length × 2 bytes (UTF-16)

示例（500 字符文本）:
100 + 500 × 2 = 1100 bytes ≈ 1.1 KB
```

**边内存**:
```
Edge 对象 ≈ 200 bytes

包含：
- id (string)
- source (string)
- target (string)
- type (string)
- data (object with function)
```

**总估算**:
```
100 节点 × 1 KB + 120 边 × 0.2 KB = 100 + 24 = 124 KB
```

---

## 🔄 数据转换

### Nodes/Edges → ConversationHistory

```javascript
// 输入
const nodes = [...];  // Node[]
const edges = [...];  // Edge[]

// 输出
const history = getConversationHistory(targetNode, nodes, edges);
// ConversationHistory[]
```

### ConversationHistory → LLM Messages

```javascript
// 输入
const history = [...];  // ConversationHistory[]

// 输出（发送给 LLM）
const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: JSON.stringify({ conversation: history }) }
];
```

**为什么包装在 JSON.stringify？**
- System Prompt 期望 JSON 格式的对话树
- LLM 需要理解节点间的关系（parent/children）
- 保持结构化信息，不是简单的文本拼接

---

## 🛠️ 工具函数

### 1. 节点查找

```javascript
// 根据 ID 查找节点
const node = nodes.find(n => n.id === nodeId);

// 查找某类型的所有节点
const userInputNodes = nodes.filter(n => n.type === 'userInput');
const llmResponseNodes = nodes.filter(n => n.type === 'llmResponse');
```

### 2. 关系查询

```javascript
// 查找父节点
const parents = getIncomers({ id: nodeId }, nodes, edges);

// 查找子节点
const children = getOutgoers({ id: nodeId }, nodes, edges);

// 查找所有祖先
const ancestors = findAllPrecedents(nodeId, nodes, edges);

// 查找所有后代
const descendants = findAllDescendants(nodeId, nodes, edges);
```

### 3. 树遍历

```javascript
// 深度优先遍历（DFS）
function dfs(nodeId, nodes, edges, visited = new Set()) {
  if (visited.has(nodeId)) return;
  visited.add(nodeId);
  
  const node = nodes.find(n => n.id === nodeId);
  console.log(node);
  
  const children = getOutgoers(node, nodes, edges);
  children.forEach(child => dfs(child.id, nodes, edges, visited));
}

// 广度优先遍历（BFS）
function bfs(startNodeId, nodes, edges) {
  const queue = [startNodeId];
  const visited = new Set();
  
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    console.log(node);
    
    const children = getOutgoers(node, nodes, edges);
    children.forEach(child => queue.push(child.id));
  }
}
```

---

## 📋 数据验证

### 节点验证

```javascript
function validateNode(node) {
  if (!node.id || typeof node.id !== 'string') {
    throw new Error('Invalid node ID');
  }
  
  if (!['userInput', 'llmResponse'].includes(node.type)) {
    throw new Error('Invalid node type');
  }
  
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
    throw new Error('Invalid node position');
  }
  
  if (!node.data || typeof node.data.text !== 'string') {
    throw new Error('Invalid node data');
  }
  
  return true;
}
```

### 边验证

```javascript
function validateEdge(edge, nodes) {
  if (!edge.id || typeof edge.id !== 'string') {
    throw new Error('Invalid edge ID');
  }
  
  const sourceExists = nodes.some(n => n.id === edge.source);
  const targetExists = nodes.some(n => n.id === edge.target);
  
  if (!sourceExists || !targetExists) {
    throw new Error('Edge references non-existent node');
  }
  
  if (edge.source === edge.target) {
    throw new Error('Self-loop not allowed');
  }
  
  return true;
}
```

---

**维护者**: GitChat Team  
**相关文档**: [ARCHITECTURE.md](./ARCHITECTURE.md)

