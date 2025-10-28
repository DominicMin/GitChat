/**
 * POC Test 1: 基础功能验证
 * 测试能否初始化 Config 和 GeminiClient
 */

// 设置控制台编码为 UTF-8（解决中文乱码）
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
}

const { Config } = require('@google/gemini-cli-core');

async function test() {
  console.log('🚀 POC Test 1: 基础功能验证\n');
  
  try {
    console.log('📦 步骤 1: 创建 Config 实例...');
    const config = new Config();
    
    console.log('⚙️  步骤 2: 初始化 Config...');
    await config.initialize();
    
    console.log('🤖 步骤 3: 获取 GeminiClient...');
    const client = config.getGeminiClient();
    
    console.log('✅ 步骤 4: 发送简单测试消息...');
    const response = await client.sendMessage(
      {
        role: 'user',
        parts: [{ text: 'Hello! Please respond with just "Hi" to confirm you received this.' }]
      },
      new AbortController().signal
    );
    
    console.log('\n📬 收到响应:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\n✅ 基础功能测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
console.log('请确保已设置 GEMINI_API_KEY 环境变量！');
console.log('获取 API Key: https://aistudio.google.com/apikey\n');

test();

