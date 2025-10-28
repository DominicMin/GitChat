# GitChat 组件 API 文档

> **版本**: v1.0  
> **最后更新**: 2025-10-28

---

## 📋 目录

1. [NodeChat](#nodechat---主应用组件)
2. [UserInputNode](#userinputnode---用户输入节点)
3. [LLMResponseNode](#llmresponsenode---llm-响应节点)
4. [CustomEdge](#customedge---自定义边)
5. [Utility Functions](#utility-functions---工具函数)

---

## NodeChat - 主应用组件

**文件**: `nodechat/src/components/NodeChat.js`

### 描述

主应用组件，管理整个对话图的状态和交互。

### Props

无（顶层组件）

### State

```typescript
interface NodeChatState {
  nodes: Node[];              // 节点数组
  edges: Edge[];              // 边数组
  message: string;            // 输入框文本
}
```

### Methods

#### addNode()

```typescript
function addNode(
  type: 'userInput' | 'llmResponse',
  sourceNode?: Node,
  offset?: { x: number; y: number },
  text?: string,
  connectToSource?: boolean
): Promise<Node>
```

**描述**: 添加新节点到画布

**参数**:
- `type`: 节点类型
- `sourceNode`: 源节点（用于计算位置）
- `offset`: 相对于源节点的偏移量
- `text`: 节点初始文本
- `connectToSource`: 是否连接到源节点

**返回**: Promise<Node>

**示例**:
```javascript
// 在视口中心创建节点
await addNode('userInput');

// 在源节点下方创建连接的节点
await addNode('llmResponse', sourceNode, { x: 0, y: 150 }, '', true);
```

#### handleSendMessage()

```typescript
function handleSendMessage(): Promise<void>
```

**描述**: 处理用户发送消息

**流程**:
1. 创建用户输入节点
2. 创建空的 LLM 响应节点
3. 连接两个节点
4. 获取上下文历史
5. 发送请求到后端
6. 流式更新响应

**示例**:
```javascript
// 用户在输入框输入文本并点击发送
// 自动触发此方法
```

#### handleReplicate()

```typescript
function handleReplicate({ props }): Promise<void>
```

**描述**: 复制节点并保持上游连接

**参数**:
- `props.node`: 要复制的节点

**示例**:
```javascript
// 右键菜单触发
<Item onClick={handleReplicate}>Replicate Node</Item>
```

#### handleCreateConnectedNode()

```typescript
function handleCreateConnectedNode({ props }): void
```

**描述**: 创建连接到当前节点的新节点

**参数**:
- `props.node`: 源节点

**逻辑**:
- 如果源节点是 `userInput`，创建 `llmResponse`
- 如果源节点是 `llmResponse`，创建 `userInput`

---

## UserInputNode - 用户输入节点

**文件**: `nodechat/src/components/UserInputNode.js`

### Props

```typescript
interface UserInputNodeProps {
  id: string;                // 节点 ID
  data: {
    text: string;            // 节点文本内容
  };
  selected?: boolean;        // 是否被选中
}
```

### State

```typescript
interface UserInputNodeState {
  isEditing: boolean;        // 是否处于编辑模式
  text: string;              // 当前文本（本地状态）
  isFolded: boolean;         // 是否折叠
  isFoldable: boolean;       // 是否可折叠
}
```

### Methods

#### onRegenerate()

```typescript
function onRegenerate(): Promise<void>
```

**描述**: 重新生成响应（级联）

**流程**:
1. 查找所有子孙节点
2. 筛选出 `llmResponse` 类型节点
3. 清空响应文本
4. 逐个重新生成

**触发**: 点击 ♻️ 按钮

#### regenerateNode()

```typescript
function regenerateNode(node: Node): Promise<void>
```

**描述**: 重新生成单个节点的响应

**参数**:
- `node`: 要重新生成的 LLM 响应节点

**流程**:
1. 获取上下文历史
2. 发送请求
3. 流式更新节点内容

#### handleDoubleClick()

```typescript
function handleDoubleClick(): void
```

**描述**: 进入编辑模式

**效果**:
- `isEditing` 设为 `true`
- 聚焦并选中 textarea

#### onTextBlur()

```typescript
function onTextBlur(): void
```

**描述**: 退出编辑模式并保存

**效果**:
- `isEditing` 设为 `false`
- 更新节点 data
- 触发 `onRegenerate()`（重新生成所有后代响应）

#### toggleFold()

```typescript
function toggleFold(): void
```

**描述**: 切换折叠/展开状态

### UI Features

**连接点**:
- Top Handle (target): 接收来自上游的连接
- Bottom Handle (source): 连接到下游节点

**样式**:
- 背景色: `bg-green-100`
- 边框: `border-green-200` (未选中) / `border-green-500` (选中)
- 最小宽度: 10em
- 最大宽度: 35em

**交互**:
- 双击: 编辑文本
- 点击 ♻️: 重新生成响应
- 点击 Fold/Expand: 折叠/展开

---

## LLMResponseNode - LLM 响应节点

**文件**: `nodechat/src/components/LLMResponseNode.js`

### Props

```typescript
interface LLMResponseNodeProps {
  id: string;                // 节点 ID
  data: {
    text: string;            // 节点文本内容（Markdown格式）
  };
  selected?: boolean;        // 是否被选中
}
```

### State

```typescript
interface LLMResponseNodeState {
  isEditing: boolean;        // 是否处于编辑模式
  text: string;              // 当前文本（本地状态）
  isFolded: boolean;         // 是否折叠
  isFoldable: boolean;       // 是否可折叠
}
```

### Methods

#### handleDoubleClick()

```typescript
function handleDoubleClick(): void
```

**描述**: 进入编辑模式

**效果**:
- `isEditing` 设为 `true`
- 切换到 textarea
- 自动调整 textarea 大小

#### onTextBlur()

```typescript
function onTextBlur(): void
```

**描述**: 退出编辑模式并保存

**效果**:
- `isEditing` 设为 `false`
- 更新节点 data
- 切换回 Markdown 渲染

#### toggleFold()

```typescript
function toggleFold(): void
```

**描述**: 切换折叠/展开状态

### Markdown Rendering

使用 **ReactMarkdown** + **react-syntax-highlighter**

**支持的特性**:
- 标题 (H1-H6)
- 列表 (有序/无序)
- 链接
- 代码块（带语法高亮）
- 行内代码
- 表格（通过 remark-gfm）
- 删除线、任务列表（通过 remark-gfm）

**代码高亮配置**:
```javascript
<SyntaxHighlighter
  style={okaidia}          // 代码主题
  language={match[1]}       // 自动检测语言
  PreTag="div"
>
  {children}
</SyntaxHighlighter>
```

**支持的语言**: JavaScript, Python, Java, C++, Go, Rust, TypeScript 等

### UI Features

**连接点**:
- Top Handle (target): 接收来自上游的连接
- Bottom Handle (source): 连接到下游节点

**样式**:
- 背景色: `bg-blue-100`
- 边框: `border-blue-200` (未选中) / `border-blue-500` (选中)
- 最大宽度: 25em (折叠) / 35em (展开)

**交互**:
- 双击: 编辑文本（纯文本模式）
- 点击 Fold/Expand: 折叠/展开
- 文本可选中复制

---

## CustomEdge - 自定义边

**文件**: `nodechat/src/components/CustomEdge.js`

### Props

```typescript
interface CustomEdgeProps {
  id: string;                // 边 ID
  sourceX: number;           // 源节点 X 坐标
  sourceY: number;           // 源节点 Y 坐标
  targetX: number;           // 目标节点 X 坐标
  targetY: number;           // 目标节点 Y 坐标
  sourcePosition: Position;  // 源节点连接点位置
  targetPosition: Position;  // 目标节点连接点位置
  style?: React.CSSProperties;  // 自定义样式
  data: {
    onEdgeClick: (edgeId: string) => void;  // 点击回调
  };
}

type Position = 'top' | 'bottom' | 'left' | 'right';
```

### Rendering

**路径类型**: 贝塞尔曲线

```javascript
const edgePath = getBezierPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
});
```

**双层路径**:
1. **可见路径**: 显示连接线
   - 颜色: `#bbb`
   - 宽度: 3px
   
2. **交互路径**: 扩大点击区域
   - 颜色: `transparent`
   - 宽度: 20px
   - 光标: `pointer`

### Interaction

**点击效果**: 删除边（断开连接）

```javascript
onClick={() => data.onEdgeClick(id)}
```

---

## Utility Functions - 工具函数

**文件**: `nodechat/src/components/Utility.js`

### sendConversationRequest()

```typescript
async function sendConversationRequest(
  endpoint: string,
  conversation: ConversationHistory[],
  onChunkReceived: (content: string) => void
): Promise<void>
```

**描述**: 发送请求到后端并处理 SSE 流式响应

**参数**:
- `endpoint`: API 端点（通常是 `'generate'`）
- `conversation`: 对话历史数组
- `onChunkReceived`: 收到数据块时的回调

**流程**:
1. 发送 POST 请求
2. 获取 Response Body Reader
3. 循环读取数据块
4. 解析 SSE 格式（`data: {...}\n\n`）
5. 触发回调

**示例**:
```javascript
await sendConversationRequest(
  'generate',
  history,
  (content) => {
    console.log('Received:', content);
    // 更新 UI
  }
);
```

**错误处理**:
```javascript
try {
  await sendConversationRequest(...);
} catch (error) {
  console.error('Failed to send request:', error);
  // 显示错误消息
}
```

### getConversationHistory()

```typescript
function getConversationHistory(
  node: Node,
  nodes: Node[],
  edges: Edge[]
): ConversationHistory[]
```

**描述**: 构建从根节点到目标节点的完整对话历史

**参数**:
- `node`: 目标节点（通常是新创建的 LLM 响应节点）
- `nodes`: 所有节点数组
- `edges`: 所有边数组

**返回**: 对话历史数组（按时间顺序）

**算法**: 深度优先递归

```javascript
function processNode(currentNode) {
  // 1. 构建当前节点的历史记录
  const nodeHistory = {
    id: currentNode.id,
    role: currentNode.type === 'userInput' ? 'user' : 'assistant',
    parent: getIncomers(currentNode).map(n => n.id),
    content: currentNode.data.text,
    children: /* ... */
  };
  
  // 2. 插入到数组开头
  history.unshift(nodeHistory);
  
  // 3. 递归处理父节点
  getIncomers(currentNode).forEach(parent => {
    processNode(parent);
  });
}
```

**示例**:
```javascript
const history = getConversationHistory(llmNode, nodes, edges);
console.log(history);
// [
//   { id: 'userInput-1', role: 'user', ... },
//   { id: 'llmResponse-2', role: 'assistant', ... },
//   { id: 'userInput-3', role: 'user', ... }
// ]
```

### findAllDescendants()

```typescript
function findAllDescendants(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): string[]
```

**描述**: 查找节点的所有后代节点 ID

**参数**:
- `nodeId`: 起始节点 ID
- `nodes`: 所有节点数组
- `edges`: 所有边数组

**返回**: 后代节点 ID 数组

**算法**: 深度优先递归

```javascript
function findAllDescendants(nodeId, nodes, edges) {
  const outgoers = getOutgoers({ id: nodeId }, nodes, edges);
  let descendants = [...outgoers.map(o => o.id)];

  outgoers.forEach((outgoer) => {
    descendants = descendants.concat(
      findAllDescendants(outgoer.id, nodes, edges)
    );
  });

  return descendants;
}
```

**用途**: 级联重新生成（找到所有需要更新的 LLM 响应节点）

**示例**:
```javascript
const descendants = findAllDescendants('userInput-123', nodes, edges);
// ['llmResponse-124', 'userInput-125', 'llmResponse-126', ...]
```

### findAllPrecedents()

```typescript
function findAllPrecedents(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): string[]
```

**描述**: 查找节点的所有祖先节点 ID

**参数**:
- `nodeId`: 起始节点 ID
- `nodes`: 所有节点数组
- `edges`: 所有边数组

**返回**: 祖先节点 ID 数组

**算法**: 深度优先递归（向上遍历）

```javascript
function findAllPrecedents(nodeId, nodes, edges) {
  const incomers = getIncomers({ id: nodeId }, nodes, edges);
  let precedents = [...incomers.map(i => i.id)];

  incomers.forEach((incomer) => {
    precedents = precedents.concat(
      findAllPrecedents(incomer.id, nodes, edges)
    );
  });

  return precedents;
}
```

**用途**: 上下文分析、依赖检查

**示例**:
```javascript
const precedents = findAllPrecedents('llmResponse-456', nodes, edges);
// ['userInput-455', 'llmResponse-454', 'userInput-453', ...]
```

---

## 🎨 样式常量

### Node 样式

```javascript
// UserInputNode
const USER_INPUT_COLORS = {
  background: 'bg-green-100',
  border: 'border-green-200',
  borderSelected: 'border-green-500',
  handle: '!bg-teal-500'
};

// LLMResponseNode
const LLM_RESPONSE_COLORS = {
  background: 'bg-blue-100',
  border: 'border-blue-200',
  borderSelected: 'border-blue-500',
  handle: '!bg-blue-500'
};

// Sizes
const NODE_SIZES = {
  minWidth: '10em',
  maxWidth: '35em',
  maxWidthFolded: '25em',
  maxHeightFolded: '10em',
  handleSize: '!w-3 !h-3'
};
```

### Edge 样式

```javascript
const EDGE_STYLES = {
  strokeWidth: 3,
  stroke: '#bbb',
  hitAreaWidth: 20  // 透明交互区域
};
```

---

## 🔧 Hooks 使用

### ReactFlow Hooks

```javascript
import { useReactFlow, useNodesState, useEdgesState, useStoreApi } from '@xyflow/react';

// 获取 ReactFlow 实例
const reactFlow = useReactFlow();

// 节点和边的状态管理
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);

// 访问内部 store
const store = useStoreApi();
const { height, width, transform } = store.getState();
```

### Context Menu Hook

```javascript
import { useContextMenu } from 'react-contexify';

const { show } = useContextMenu({
  id: MENU_ID,
});

// 显示右键菜单
const onNodeContextMenu = useCallback((event, node) => {
  event.preventDefault();
  show({
    event,
    props: { node }
  });
}, [show]);
```

---

## 📦 第三方库集成

### ReactFlow

```javascript
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  getBezierPath,
  getIncomers,
  getOutgoers,
} from '@xyflow/react';
```

### Markdown Rendering

```javascript
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
```

### Context Menu

```javascript
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
```

---

## 🐛 常见问题

### Q: 节点不更新？

**A**: 确保使用不可变更新

```javascript
// ❌ 错误
nodes[0].data.text = 'new text';
setNodes(nodes);

// ✅ 正确
setNodes((nds) => nds.map((n) => 
  n.id === nodeId 
    ? { ...n, data: { ...n.data, text: 'new text' } }
    : n
));
```

### Q: 流式响应中断？

**A**: 检查 SSE 格式解析

```javascript
// 正确的 SSE 格式
data: {"content":"text"}\n\n

// 错误的格式
{"content":"text"}  // 缺少 "data: " 前缀和 \n\n 结尾
```

### Q: 节点位置计算不准确？

**A**: 考虑视口变换和缩放

```javascript
const { transform: [transformX, transformY, zoomLevel] } = store.getState();
const zoomMultiplier = 1 / zoomLevel;

const centerX = -transformX * zoomMultiplier + (width * zoomMultiplier) / 2;
const centerY = -transformY * zoomMultiplier + (height * zoomMultiplier) / 2;
```

---

**维护者**: GitChat Team  
**相关文档**: 
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATA_STRUCTURES.md](./DATA_STRUCTURES.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)

