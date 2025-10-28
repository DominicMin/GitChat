# GitChat 开发指南

> **版本**: v1.0  
> **最后更新**: 2025-10-28

---

## 📋 目录

1. [开发环境设置](#开发环境设置)
2. [项目结构](#项目结构)
3. [开发工作流](#开发工作流)
4. [调试技巧](#调试技巧)
5. [贡献指南](#贡献指南)

---

## 🛠️ 开发环境设置

### 前置要求

- **Node.js**: v14.0.0 或更高
- **npm**: v6.0.0 或更高
- **操作系统**: Windows, macOS, 或 Linux

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/DrustZ/GitChat
cd GitChat

# 2. 安装所有依赖
npm run install:all

# 3. 配置环境变量
cd server
cp .env.example .env
# 编辑 .env 文件，添加你的 API key

# 4. 启动开发服务器
cd ..
npm run dev    # 使用 nodemon 自动重启后端
# 或
npm start      # 标准启动
```

### 分别启动前后端

```bash
# 终端 1: 后端
cd server
npm run dev      # 使用 nodemon（推荐开发时使用）
# 或
npm start        # 标准启动

# 终端 2: 前端
cd nodechat
npm start
```

---

## 📁 项目结构

```
GitChat/
├── nodechat/                    # 前端应用
│   ├── public/                  # 静态资源
│   │   ├── index.html           # HTML 模板
│   │   └── favicon.ico
│   ├── src/                     # 源代码
│   │   ├── components/          # React 组件
│   │   │   ├── NodeChat.js      # 主应用组件
│   │   │   ├── UserInputNode.js # 用户输入节点
│   │   │   ├── LLMResponseNode.js # LLM 响应节点
│   │   │   ├── CustomEdge.js    # 自定义边
│   │   │   └── Utility.js       # 工具函数
│   │   ├── App.js               # App 入口
│   │   ├── App.css              # 全局样式
│   │   ├── index.js             # React 入口
│   │   └── index.css            # 基础样式
│   ├── package.json             # 前端依赖
│   └── tailwind.config.js       # Tailwind 配置
│
├── server/                      # 后端服务
│   ├── server.js                # Express 服务器
│   ├── llm-branched-conversation-prompt.md  # System Prompt
│   ├── .env.example             # 环境变量模板
│   ├── .env                     # 环境变量（git ignored）
│   └── package.json             # 后端依赖
│
├── docs/                        # 技术文档
│   ├── ARCHITECTURE.md          # 架构文档
│   ├── DATA_STRUCTURES.md       # 数据结构文档
│   └── DEVELOPMENT.md           # 本文档
│
├── package.json                 # 根项目配置
├── start.bat                    # Windows 启动脚本
├── start.sh                     # Linux/Mac 启动脚本
├── ROADMAP.md                   # 功能路线图
└── readme.md                    # 项目说明

```

---

## 🔄 开发工作流

### 1. 创建新功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发流程

#### 前端开发

**热重载**：修改文件后自动刷新浏览器

```bash
cd nodechat
npm start
```

**常见修改场景**：

**场景 A: 修改节点样式**
```javascript
// UserInputNode.js 或 LLMResponseNode.js
<div className="px-4 py-2 shadow-md rounded-md bg-green-100 ...">
  // 修改 Tailwind 类名即可
</div>
```

**场景 B: 添加新的节点类型**
```javascript
// 1. 创建新组件
// src/components/DocumentNode.js
export default function DocumentNode(props) {
  return (
    <div className="...">
      <Handle type="target" position={Position.Top} />
      {/* 你的内容 */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// 2. 注册节点类型
// NodeChat.js
import DocumentNode from './DocumentNode';

const nodeTypes = {
  userInput: UserInputNode,
  llmResponse: LLMResponseNode,
  document: DocumentNode,  // 新增
};
```

**场景 C: 修改上下文构建逻辑**
```javascript
// Utility.js
export function getConversationHistory(node, nodes, edges) {
  // 修改这里的逻辑
}
```

#### 后端开发

**自动重启**：使用 nodemon

```bash
cd server
npm run dev
```

**常见修改场景**：

**场景 A: 修改 System Prompt**
```bash
# 直接编辑文件
vim server/llm-branched-conversation-prompt.md

# nodemon 会自动重启服务器并重新加载
```

**场景 B: 添加新的 API endpoint**
```javascript
// server.js
app.post("/your-new-endpoint", async (req, res) => {
  try {
    // 你的逻辑
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**场景 C: 修改 LLM 请求参数**
```javascript
// server.js
const stream = await openai.chat.completions.create({
  model: MODEL_NAME,
  messages: [...],
  stream: true,
  temperature: 0.7,      // 新增参数
  max_tokens: 2000,      // 新增参数
});
```

### 3. 测试

**手动测试清单**：

- [ ] 创建用户输入节点
- [ ] 发送消息生成 LLM 响应
- [ ] 双击编辑节点内容
- [ ] 创建分支（右键菜单 → Replicate）
- [ ] 合并分支（连接多个节点到一个节点）
- [ ] 删除节点和边
- [ ] 重新生成响应（♻️ 按钮）
- [ ] 级联重新生成（编辑用户输入后）
- [ ] 折叠/展开长文本
- [ ] 拖拽节点移动
- [ ] 缩放和平移画布

**浏览器开发者工具**：

```javascript
// 在浏览器控制台查看当前状态
window.__reactFlow = reactFlow;
console.log(window.__reactFlow.getNodes());
console.log(window.__reactFlow.getEdges());
```

### 4. 提交代码

```bash
# 1. 查看修改
git status
git diff

# 2. 暂存修改
git add .

# 3. 提交（遵循 Conventional Commits）
git commit -m "feat: add document node support"
# 或
git commit -m "fix: resolve edge deletion bug"
# 或
git commit -m "docs: update architecture documentation"

# 4. 推送到远程
git push origin feature/your-feature-name
```

**Commit 消息规范**：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

---

## 🐛 调试技巧

### Frontend 调试

#### 1. React Developer Tools

安装浏览器扩展：
- Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**用途**：
- 查看组件树
- 检查 props 和 state
- 追踪组件更新

#### 2. ReactFlow 调试

```javascript
// NodeChat.js
import { useReactFlow } from '@xyflow/react';

function NodeChat() {
  const reactFlow = useReactFlow();
  
  // 调试节点和边
  useEffect(() => {
    console.log('Current nodes:', reactFlow.getNodes());
    console.log('Current edges:', reactFlow.getEdges());
  }, [nodes, edges]);
  
  // 调试视口状态
  useEffect(() => {
    const viewport = reactFlow.getViewport();
    console.log('Viewport:', viewport);
  }, []);
}
```

#### 3. 网络请求调试

```javascript
// Utility.js
export async function sendConversationRequest(endpoint, conversation, onChunkReceived) {
  console.log('Sending request:', { endpoint, conversation });
  
  const response = await fetch(`http://localhost:8000/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation }),
  });
  
  console.log('Response status:', response.status);
  
  // ... SSE 处理
}
```

**浏览器 Network 面板**：
- 查看请求/响应头
- 检查请求体
- 查看 SSE 事件流

#### 4. 常见问题排查

**问题：节点位置不正确**
```javascript
// 检查坐标计算
const {
  height, width,
  transform: [transformX, transformY, zoomLevel]
} = store.getState();

console.log('Viewport info:', { height, width, transformX, transformY, zoomLevel });
```

**问题：上下文历史不完整**
```javascript
// 在 getConversationHistory 中添加日志
function processNode(currentNode) {
  console.log('Processing node:', currentNode.id);
  console.log('Parents:', getIncomers(currentNode));
  console.log('Children:', getOutgoers(currentNode));
  // ...
}
```

**问题：流式响应中断**
```javascript
// 在 onChunkReceived 中添加日志
const onChunkReceived = useCallback((content) => {
  console.log('Received chunk:', content);
  setNodes((nds) => /* ... */);
}, []);
```

### Backend 调试

#### 1. 日志输出

```javascript
// server.js
app.post("/generate", async (req, res) => {
  console.log('=== Generate Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Conversation:', JSON.stringify(req.body, null, 2));
  
  try {
    const stream = await openai.chat.completions.create({...});
    
    for await (const chunk of stream) {
      console.log('Stream chunk:', chunk.choices[0]?.delta?.content || '[empty]');
      // ...
    }
  } catch (error) {
    console.error('=== Error ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
});
```

#### 2. 请求验证

```javascript
// 添加中间件验证
app.use('/generate', (req, res, next) => {
  if (!req.body.conversation) {
    return res.status(400).json({ error: 'Missing conversation' });
  }
  
  if (!Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: 'Conversation must be an array' });
  }
  
  console.log('Validation passed');
  next();
});
```

#### 3. 模拟 LLM 响应

在开发时避免频繁调用 API：

```javascript
// server.js（开发模式）
const DEV_MODE = process.env.NODE_ENV === 'development';

app.post("/generate", async (req, res) => {
  // ...
  
  if (DEV_MODE) {
    // 模拟流式响应
    const mockResponse = "这是一个模拟的响应，用于开发测试。";
    for (const char of mockResponse) {
      await new Promise(resolve => setTimeout(resolve, 50));
      res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
    res.end();
    return;
  }
  
  // 正常的 LLM 请求
  // ...
});
```

---

## 🧪 测试

### 单元测试（TODO）

当前项目未实现测试，以下是推荐的测试框架：

**前端**：
- **Jest**: 测试运行器
- **React Testing Library**: 组件测试
- **MSW**: Mock API 请求

```bash
# 安装依赖
npm install --save-dev @testing-library/react @testing-library/jest-dom msw

# 运行测试
npm test
```

**示例测试**：

```javascript
// NodeChat.test.js
import { render, screen } from '@testing-library/react';
import NodeChat from './NodeChat';

test('renders add user input button', () => {
  render(<NodeChat />);
  const button = screen.getByText(/Add User Input/i);
  expect(button).toBeInTheDocument();
});
```

**后端**：
- **Jest**: 测试运行器
- **Supertest**: API 测试

```javascript
// server.test.js
const request = require('supertest');
const app = require('./server');

describe('POST /generate', () => {
  it('should return a stream of responses', async () => {
    const response = await request(app)
      .post('/generate')
      .send({ conversation: [...] })
      .expect(200);
    
    // Assert response
  });
});
```

### E2E 测试（TODO）

推荐使用 **Playwright** 或 **Cypress**

---

## 📝 代码风格

### JavaScript/JSX

遵循 **Airbnb JavaScript Style Guide**

**关键规则**：
- 使用 2 空格缩进
- 使用单引号
- 组件名使用 PascalCase
- 函数名使用 camelCase
- 常量名使用 UPPER_SNAKE_CASE

**ESLint 配置**：

```json
// .eslintrc.json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "warn"
  }
}
```

### CSS/Tailwind

- 优先使用 Tailwind 工具类
- 避免内联样式（除非动态计算）
- 自定义样式放在 `.css` 文件中

---

## 🔧 常用命令

```bash
# 安装依赖
npm run install:all          # 安装所有依赖（根+前端+后端）
npm install                  # 仅安装根依赖

# 启动应用
npm start                    # 同时启动前后端
npm run start:client         # 仅启动前端
npm run start:server         # 仅启动后端
npm run dev                  # 开发模式（后端使用 nodemon）

# 构建
npm run build                # 构建前端生产版本

# 清理
rm -rf node_modules nodechat/node_modules server/node_modules
npm run install:all          # 重新安装
```

---

## 🤝 贡献指南

### Pull Request 流程

1. **Fork 项目** → 创建你的分支
2. **开发功能** → 遵循代码规范
3. **测试** → 确保功能正常
4. **提交 PR** → 清晰描述你的改动

### PR 模板

```markdown
## 📝 改动描述
<!-- 简要描述你的改动 -->

## 🎯 相关 Issue
<!-- 如果有关联的 Issue，请链接 -->
Closes #123

## ✅ 测试清单
- [ ] 手动测试通过
- [ ] 无新增 lint 错误
- [ ] 文档已更新（如需要）

## 📸 截图
<!-- 如果是 UI 改动，请附上截图 -->
```

### Code Review 检查点

- ✅ 代码遵循项目风格
- ✅ 没有引入新的 warnings/errors
- ✅ 功能按预期工作
- ✅ 没有破坏现有功能
- ✅ 有必要的注释
- ✅ 文档已更新

---

## 🆘 获取帮助

- **GitHub Issues**: [https://github.com/DrustZ/GitChat/issues](https://github.com/DrustZ/GitChat/issues)
- **Discussions**: [https://github.com/DrustZ/GitChat/discussions](https://github.com/DrustZ/GitChat/discussions)
- **Email**: (项目维护者邮箱)

---

## 📚 相关资源

- [React 文档](https://react.dev/)
- [ReactFlow 文档](https://reactflow.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Express 文档](https://expressjs.com/)
- [OpenAI API 文档](https://platform.openai.com/docs/)

---

**维护者**: GitChat Team  
**最后更新**: 2025-10-28

