@echo off
REM 设置编码为 UTF-8
chcp 65001 >nul

echo ========================================
echo   Gemini CLI Core POC - 完整测试套件
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
echo Test 1: 基础功能测试
echo ========================================
node test-1-basic.js
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
node test-2-context-injection.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 2 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo Test 3: Checkpoint 分支测试
echo ========================================
node test-3-checkpoint.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 3 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo Test 4: 流式响应测试
echo ========================================
node test-4-streaming.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [失败] Test 4 未通过
    pause
    exit /b 1
)
echo.
echo.

echo ========================================
echo   🎉 所有测试通过！
echo ========================================
echo.
echo 结论:
echo   ✅ @google/gemini-cli-core 完全支持 GitChat 的需求
echo   ✅ 可以完全控制上下文流
echo   ✅ 可以实现 Git 式分支管理
echo   ✅ 可以提供流畅的流式响应
echo.
echo 下一步:
echo   1. 将 gemini-cli-core 集成到 GitChat 的 server.js
echo   2. 实现 buildContextTree() 函数
echo   3. 连接前端 ReactFlow UI
echo.
pause

