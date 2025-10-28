/**
 * POC Test 1: 基础功能验证 (使用 @google/generative-ai)
 * 验证能否连接 Gemini API
 */

// 设置控制台编码为 UTF-8（解决中文乱码）
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
}

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log('🚀 POC Test 1: 基础功能验证\n');
  
  try {
    // 检查 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('请设置 GEMINI_API_KEY 环境变量');
    }
    
    console.log('📦 步骤 1: 初始化 Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('🤖 步骤 2: 获取模型 (gemini-2.5-flash-lite)...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    console.log('✅ 步骤 3: 发送简单测试消息...');
    const result = await model.generateContent('请用一句话回复：你好');
    
    const response = result.response;
    const text = response.text();
    
    console.log('\n📬 收到响应:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));
    
    console.log('\n✅ 基础功能测试通过！');
    console.log('💡 Gemini API 连接成功！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.message.includes('API_KEY')) {
      console.error('\n💡 提示: 请检查你的 API Key 是否正确');
      console.error('   获取地址: https://aistudio.google.com/apikey');
    }
    process.exit(1);
  }
}

// 运行测试
test();

