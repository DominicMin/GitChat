# Gemini CLI Core POC

这是一个概念验证（Proof of Concept）项目，用于测试 `@google/gemini-cli-core` 是否能够支持 GitChat 的核心需求。

## 🎯 测试目标

验证以下关键功能：
1. ✅ 能否初始化 Config 和 GeminiClient
2. ✅ **能否通过 setHistory() 接管上下文流**（核心功能）
3. ✅ 能否使用 Checkpoint 保存/加载对话分支
4. ✅ 能否接收流式响应（前端实时显示）

## 📦 安装

```bash
npm install
```

## 🔑 准备 API Key

1. 访问 https://aistudio.google.com/apikey
2. 创建一个 API Key
3. 设置环境变量：

### Windows (PowerShell)
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

### Linux/Mac (Bash)
```bash
export GEMINI_API_KEY="your-api-key-here"
```

## 🧪 运行测试

### Test 1: 基础功能
```bash
node test-1-basic.js
```

验证能否成功初始化和发送简单消息。

### Test 2: 上下文注入（⭐ 核心测试）
```bash
node test-2-context-injection.js
```

**这是最关键的测试！** 验证能否：
- 通过 `setHistory()` 注入自定义对话历史
- AI 是否能记住注入的上下文
- 这将决定 GitChat 能否实现 Git 式分支管理

### Test 3: Checkpoint 分支管理
```bash
node test-3-checkpoint.js
```

验证能否：
- 保存对话到 checkpoint（对应 GitChat 的分支保存）
- 加载 checkpoint 恢复对话（对应分支切换）
- 多个分支之间是否隔离

### Test 4: 流式响应
```bash
node test-4-streaming.js
```

验证能否：
- 接收实时流式响应
- 逐字显示 AI 回答（前端 UX 关键）

## 📊 预期结果

如果所有测试通过，说明：
1. ✅ 可以完全控制 Gemini 的上下文流
2. ✅ 可以实现 GitChat 的分支管理
3. ✅ 可以提供流畅的用户体验
4. ✅ **Gemini CLI Core 是 GitChat 的完美基础设施！**

## 🎯 下一步

如果 POC 成功，下一步是：
1. 将 `@google/gemini-cli-core` 集成到 GitChat 的 backend
2. 改造 `server.js` 的 `/generate` endpoint
3. 实现 `buildContextTree()` 函数（从 nodes/edges 重建上下文）
4. 连接前端的 ReactFlow UI

## 💡 关键发现

- `Config.initialize()` - 初始化配置
- `client.setHistory(history)` - **接管上下文**（核心）
- `client.sendMessageStream()` - 流式响应
- `logger.saveCheckpoint() / loadCheckpoint()` - 分支管理

## 🔗 相关资源

- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)
- [Gemini API 文档](https://ai.google.dev/docs)

