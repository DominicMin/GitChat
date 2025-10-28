# Gemini POC v2 - 使用 @google/generative-ai SDK

## 🔄 为什么从 cli-core 切换到 generative-ai？

### 问题
`@google/gemini-cli-core` 是设计为在完整 CLI 环境中运行的，需要：
- 复杂的初始化上下文（sessionId, 文件系统, 配置等）
- 不适合直接在代码中使用
- 更适合作为命令行工具的一部分

### 解决方案
使用 `@google/generative-ai` SDK：
- ✅ Google 官方的 JavaScript SDK
- ✅ 专门设计为库使用
- ✅ API 简单直接
- ✅ **同样能完全控制上下文！**

## 🎯 核心测试

### Test 1: 基础连接
验证能否连接 Gemini API

```bash
node test-1-basic-v2.js
```

### Test 2: 上下文注入（⭐ 最重要）
验证能否通过 `startChat({ history })` 注入自定义历史

```bash
node test-2-context-injection-v2.js
```

**这是关键测试！** 如果通过，证明可以：
- 完全控制发送给 AI 的上下文
- 实现 GitChat 的分支管理
- 在不同分支间自由切换

### Test 3: 流式响应
验证能否实时接收 AI 回答

```bash
node test-3-streaming-v2.js
```

## 🚀 快速开始

1. **设置 API Key**
```powershell
$env:GEMINI_API_KEY="your-api-key"
```

2. **运行所有测试**
```powershell
.\run-tests-v2.bat
```

## 💡 关键 API

### 创建带历史的 Chat
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// 核心：注入自定义历史
const chat = model.startChat({
  history: [
    { role: 'user', parts: [{ text: '...' }] },
    { role: 'model', parts: [{ text: '...' }] }
  ]
});

// 继续对话
const result = await chat.sendMessage('新消息');
```

### 流式响应
```javascript
const result = await chat.sendMessageStream('消息');

for await (const chunk of result.stream) {
  const text = chunk.text();
  // 实时输出
  process.stdout.write(text);
}
```

## 🎯 GitChat 集成方案

```javascript
// server.js 伪代码
async function chatWithBranch(branchId, userMessage) {
  // 1. 从 nodes/edges 重建历史
  const contextTree = buildContextTree(branchId);
  
  // 2. 转换为 Gemini 格式
  const history = contextTree.map(node => ({
    role: node.type === 'userInput' ? 'user' : 'model',
    parts: [{ text: node.content }]
  }));
  
  // 3. 创建 chat（注入历史）
  const chat = model.startChat({ history });
  
  // 4. 发送新消息
  const result = await chat.sendMessageStream(userMessage);
  
  // 5. 流式返回给前端
  for await (const chunk of result.stream) {
    res.write(`data: ${JSON.stringify({ content: chunk.text() })}\n\n`);
  }
}
```

## ✅ 结论

使用 `@google/generative-ai` SDK：
1. ✅ 可以完全控制上下文（通过 history）
2. ✅ 支持流式响应
3. ✅ API 简单易用
4. ✅ 完美适合 GitChat 集成

**方案完全可行！** 🎉

