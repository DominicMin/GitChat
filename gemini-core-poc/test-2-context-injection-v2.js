/**
 * POC Test 2: 上下文注入测试 (使用 @google/generative-ai)
 * 核心测试：验证能否通过 Chat History 接管上下文
 */

// 设置控制台编码为 UTF-8（解决中文乱码）
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log('🚀 POC Test 2: 上下文注入测试\n');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('请设置 GEMINI_API_KEY 环境变量');
    }
    
    console.log('📦 初始化 Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    console.log('✅ 初始化成功\n');
    
    // ============ 核心测试：注入自定义历史 ============
    console.log('🎯 核心测试: 创建带有预设历史的 Chat Session...');
    
    // 构建自定义对话历史
    const customHistory = [
      {
        role: 'user',
        parts: [{ text: '我的名字是张三，我在开发一个叫 GitChat 的项目。' }]
      },
      {
        role: 'model',
        parts: [{ text: '你好张三！很高兴认识你。GitChat 听起来是个很有趣的项目。能告诉我更多关于它的信息吗？' }]
      },
      {
        role: 'user',
        parts: [{ text: '这是一个基于 Git 概念的对话管理工具，使用分支来管理不同的对话线。' }]
      },
      {
        role: 'model',
        parts: [{ text: '太棒了！用 Git 的分支概念来管理对话确实很创新。这样可以很好地处理对话的多线程和回溯。' }]
      }
    ];
    
    console.log('📝 注入的历史包含 4 条消息:');
    customHistory.forEach((msg, i) => {
      const preview = msg.parts[0].text.substring(0, 50) + '...';
      console.log(`   ${i + 1}. [${msg.role}]: ${preview}`);
    });
    
    // 使用 startChat 创建带历史的会话 - 这是关键！
    console.log('\n🔧 调用 model.startChat({ history })...');
    const chat = model.startChat({
      history: customHistory
    });
    
    console.log('✅ 带历史的 Chat Session 创建成功\n');
    
    // ============ 验证上下文是否生效 ============
    console.log('🧪 验证测试: 发送新消息，看 AI 是否记得之前的上下文...');
    
    const testPrompt = '请告诉我：1) 我的名字是什么？2) 我在做什么项目？3) 这个项目的核心概念是什么？';
    console.log(`📤 发送测试消息: "${testPrompt}"\n`);
    
    const result = await chat.sendMessage(testPrompt);
    const responseText = result.response.text();
    
    console.log('📬 AI 的回答:');
    console.log('─'.repeat(60));
    console.log(responseText);
    console.log('─'.repeat(60));
    
    // 验证 AI 是否能正确回忆
    const lowerText = responseText.toLowerCase();
    const tests = {
      '记得名字': lowerText.includes('张三') || lowerText.includes('zhangsan'),
      '记得项目': lowerText.includes('gitchat'),
      '记得概念': lowerText.includes('分支') || lowerText.includes('branch') || lowerText.includes('git')
    };
    
    console.log('\n✅ 验证结果:');
    Object.entries(tests).forEach(([test, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed ? '通过' : '失败'}`);
    });
    
    const allPassed = Object.values(tests).every(v => v);
    
    if (allPassed) {
      console.log('\n🎉 上下文注入测试完全成功！');
      console.log('💡 结论: 可以通过 startChat({ history }) 完全控制上下文流！');
      console.log('🎯 这意味着 GitChat 的分支管理方案完全可行！');
    } else {
      console.log('\n⚠️  部分测试未通过，但这可能是 AI 回答方式的问题');
      console.log('💡 建议：查看上面的回答，人工判断 AI 是否理解了上下文');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
test();

