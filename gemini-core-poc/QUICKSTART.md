# 🚀 快速开始指南

## 重要：解决中文乱码

如果看到中文乱码，在 PowerShell 中运行：
```powershell
chcp 65001
```

或者直接运行：
```powershell
.\fix-encoding.bat
```

## 第一步：获取 API Key

1. 访问 https://aistudio.google.com/apikey
2. 使用 Google 账号登录
3. 点击 "Create API Key"
4. 复制生成的 API Key

## 第二步：设置环境变量

**在 PowerShell 中运行：**
```powershell
$env:GEMINI_API_KEY="你的-api-key"
```

**验证是否设置成功：**
```powershell
echo $env:GEMINI_API_KEY
```

## 第三步：运行测试

### 方式 1：运行完整测试套件（推荐）
```powershell
.\run-all-tests.bat
```

这会依次运行所有 4 个测试，大约需要 2-3 分钟。

### 方式 2：单独运行测试
```powershell
# Test 1: 基础功能
node test-1-basic.js

# Test 2: 上下文注入（⭐ 最重要）
node test-2-context-injection.js

# Test 3: Checkpoint 分支管理
node test-3-checkpoint.js

# Test 4: 流式响应
node test-4-streaming.js
```

## 🎯 关键测试：Test 2

**Test 2 是最关键的！** 它验证了能否通过 `setHistory()` 接管上下文流。

如果 Test 2 通过，意味着：
- ✅ GitChat 可以完全控制发送给 AI 的上下文
- ✅ 可以实现 Git 式的分支管理
- ✅ 可以在不同分支间自由切换
- ✅ **整个方案完全可行！**

## 📊 预期输出

成功的 Test 2 输出应该包含：

```
🎯 核心测试: 注入自定义对话历史...
📝 注入的历史包含 4 条消息:
   1. [user]: 我的名字是张三，我在开发一个叫 GitChat 的项目。...
   2. [model]: 你好张三！很高兴认识你...
   ...

🔧 调用 client.setHistory()...
✅ 历史注入成功

🧪 验证测试: 发送新消息，看 AI 是否记得之前的上下文...

📬 AI 的回答:
────────────────────────────────────────────────────────────
根据我们之前的对话：
1) 你的名字是张三
2) 你在做 GitChat 项目
3) 这个项目使用 Git 的分支概念来管理对话
────────────────────────────────────────────────────────────

✅ 验证结果:
   ✅ 记得名字: 通过
   ✅ 记得项目: 通过
   ✅ 记得概念: 通过

🎉 上下文注入测试完全成功！
💡 结论: 可以通过 setHistory() 完全控制上下文流！
```

## ❓ 遇到问题？

### 问题 1: "GEMINI_API_KEY is not set"
**解决**: 确保在同一个 PowerShell 窗口中设置了环境变量。

### 问题 2: API 调用失败
**可能原因**:
- API Key 无效
- 网络连接问题
- API 配额用完（免费版每天 100 次）

**解决**: 检查 API Key 是否正确，尝试访问 https://aistudio.google.com 查看配额。

### 问题 3: 导入模块失败
**解决**: 
```powershell
npm install
```

## 🎉 测试通过后

如果所有测试通过，恭喜！这意味着：

1. **技术可行性 100% 确认**
2. **可以开始集成到 GitChat**
3. **预计开发时间：2-3 周**
4. **无需"重复造轮子"**

下一步查看主项目的 `docs/GEMINI_INTEGRATION_PLAN.md`（我们接下来会创建）了解详细的集成方案。

