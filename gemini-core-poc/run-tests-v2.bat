@echo off
REM 设置编码为 UTF-8
chcp 65001 >nul

echo ========================================
echo   Gemini POC - 核心功能测试 (v2)
echo ========================================
echo.

REM 检查是否设置了 API Key
if "%GEMINI_API_KEY%"=="" (
    echo [错误] 请先设置 GEMINI_API_KEY 环境变量！
    echo.
    echo 步骤:
    echo   1. 访问 https://aistudio.google.com/apikey
    echo   2. 创建 API Key
    echo   3. 运行: $env:GEMINI_API_KEY="your-key"
    echo.
    pause
    exit /b 1
)

echo [已检测到 API Key]
echo.

echo ========================================
echo Test 1: 基础连接测试
echo ========================================
node test-1-basic-v2.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 1 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo Test 2: 上下文注入测试 (核心)
echo ========================================
node test-2-context-injection-v2.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 2 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo Test 3: 流式响应测试
echo ========================================
node test-3-streaming-v2.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 3 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo   🎉 所有核心测试通过！
echo ========================================
echo.
echo 结论:
echo   ✅ Google Generative AI SDK 完全支持 GitChat 的需求
echo   ✅ 可以通过 startChat({ history }) 控制上下文
echo   ✅ 可以实现 Git 式分支管理
echo   ✅ 支持流式响应，用户体验流畅
echo.
echo 💡 关键发现:
echo   - 使用 @google/generative-ai SDK（不是 cli-core）
echo   - startChat({ history }) 可以注入自定义历史
echo   - sendMessageStream() 支持流式响应
echo   - 完美适合集成到 GitChat Backend
echo.
echo 下一步:
echo   1. 在 GitChat server.js 中集成 @google/generative-ai
echo   2. 实现 buildContextTree() 从 nodes/edges 构建历史
echo   3. 连接前端 ReactFlow UI
echo.
pause

