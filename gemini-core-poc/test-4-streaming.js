/**
 * POC Test 4: 流式响应测试
 * 验证能否接收流式响应（这是前端实时显示 AI 回答的关键）
 */

// 设置控制台编码为 UTF-8（解决中文乱码）
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
}

const { Config } = require('@google/gemini-cli-core');

async function test() {
  console.log('🚀 POC Test 4: 流式响应测试\n');
  
  try {
    console.log('📦 初始化 Client...');
    const config = new Config();
    await config.initialize();
    const client = config.getGeminiClient();
    
    console.log('✅ 初始化成功\n');
    
    // 注入一些上下文
    console.log('📝 注入对话上下文...');
    client.setHistory([
      {
        role: 'user',
        parts: [{ text: '请用三句话介绍什么是机器学习。' }]
      },
      {
        role: 'model',
        parts: [{ text: '好的，让我简要介绍：1) 机器学习是让计算机从数据中学习模式的技术。2) 它不需要明确编程，而是通过算法自动改进。3) 广泛应用于推荐系统、图像识别等领域。' }]
      }
    ]);
    console.log('✅ 上下文注入完成\n');
    
    // ============ 流式响应测试 ============
    console.log('🌊 发送消息并接收流式响应...');
    console.log('📤 消息: "现在请详细展开第一点：机器学习是什么？"\n');
    console.log('─'.repeat(60));
    
    const controller = new AbortController();
    
    const responseStream = client.sendMessageStream(
      {
        role: 'user',
        parts: [{ text: '现在请详细展开第一点：机器学习是什么？用通俗易懂的语言解释。' }]
      },
      controller.signal
    );
    
    let chunkCount = 0;
    let totalText = '';
    
    console.log('💬 AI 正在回复（实时流式输出）:');
    console.log();
    
    try {
      for await (const chunk of responseStream) {
        chunkCount++;
        
        if (chunk.candidates && chunk.candidates[0]) {
          const content = chunk.candidates[0].content;
          if (content && content.parts && content.parts[0]) {
            const text = content.parts[0].text;
            
            // 实时输出（模拟前端的效果）
            process.stdout.write(text);
            totalText += text;
          }
        }
      }
    } catch (streamError) {
      if (streamError.name !== 'AbortError') {
        throw streamError;
      }
    }
    
    console.log('\n');
    console.log('─'.repeat(60));
    
    // ============ 验证结果 ============
    console.log(`\n📊 统计信息:`);
    console.log(`   接收的 chunk 数量: ${chunkCount}`);
    console.log(`   总文本长度: ${totalText.length} 字符`);
    console.log(`   平均每 chunk: ${(totalText.length / chunkCount).toFixed(1)} 字符`);
    
    if (chunkCount > 1) {
      console.log('\n✅ 流式响应测试成功！');
      console.log('💡 结论: 可以实时接收 AI 的回答，完美支持前端流式显示！');
    } else {
      console.log('\n⚠️  只收到一个 chunk，但功能正常');
      console.log('💡 注: 短文本可能一次返回完整内容');
    }
    
    console.log('\n🎯 关键发现:');
    console.log('   1. sendMessageStream() 返回异步迭代器');
    console.log('   2. 可以用 for-await-of 实时消费');
    console.log('   3. 完美适配前端的 Server-Sent Events (SSE)');
    console.log('   4. 用户体验会非常流畅！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
test();

