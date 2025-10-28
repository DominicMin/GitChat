/**
 * POC Test 3: Checkpoint (分支保存/加载) 测试
 * 验证能否使用 Logger 保存和恢复对话分支
 */

// 设置控制台编码为 UTF-8（解决中文乱码）
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8');
}

const { Config } = require('@google/gemini-cli-core');

async function test() {
  console.log('🚀 POC Test 3: Checkpoint 分支测试\n');
  
  try {
    console.log('📦 初始化 Config 和 Client...');
    const config = new Config();
    await config.initialize();
    const client = config.getGeminiClient();
    const logger = config.getLogger();
    
    console.log('✅ 初始化成功\n');
    
    // ============ 模拟 GitChat 的分支场景 ============
    console.log('🌿 场景模拟: GitChat 分支管理');
    console.log('   我们将创建两个分支：branch-main 和 branch-feature\n');
    
    // 分支 1: Main Branch
    console.log('📝 创建 Branch Main...');
    const branchMain = [
      {
        role: 'user',
        parts: [{ text: '你好，我想了解 React Hooks。' }]
      },
      {
        role: 'model',
        parts: [{ text: 'React Hooks 是 React 16.8 引入的特性，让你在函数组件中使用 state 和其他 React 特性。' }]
      }
    ];
    
    console.log('💾 保存 branch-main...');
    await logger.saveCheckpoint(branchMain, 'branch-main');
    console.log('✅ branch-main 保存成功\n');
    
    // 分支 2: Feature Branch (从 main 分叉)
    console.log('🔀 创建 Branch Feature (从 main 分叉)...');
    const branchFeature = [
      ...branchMain, // 包含 main 的历史
      {
        role: 'user',
        parts: [{ text: '能详细讲讲 useState 吗？' }]
      },
      {
        role: 'model',
        parts: [{ text: 'useState 是最常用的 Hook。它接受初始状态，返回当前状态和更新函数。例如: const [count, setCount] = useState(0);' }]
      }
    ];
    
    console.log('💾 保存 branch-feature...');
    await logger.saveCheckpoint(branchFeature, 'branch-feature');
    console.log('✅ branch-feature 保存成功\n');
    
    // ============ 测试分支切换 ============
    console.log('🔄 测试分支切换功能...\n');
    
    // 切换到 branch-main
    console.log('1️⃣  加载 branch-main...');
    const loadedMain = await logger.loadCheckpoint('branch-main');
    client.setHistory(loadedMain);
    console.log(`   ✅ 已切换到 branch-main (${loadedMain.length} 条消息)`);
    
    // 在 main 分支发送消息
    console.log('   📤 在 main 分支发送新消息...');
    const mainResponse = await client.sendMessage(
      {
        role: 'user',
        parts: [{ text: '总结一下我们刚才讨论了什么？' }]
      },
      new AbortController().signal
    );
    
    console.log('   📬 Main 分支回答:');
    if (mainResponse.candidates && mainResponse.candidates[0]) {
      const text = mainResponse.candidates[0].content.parts[0].text;
      console.log('   ' + text.substring(0, 100) + '...\n');
    }
    
    // 切换到 branch-feature
    console.log('2️⃣  加载 branch-feature...');
    const loadedFeature = await logger.loadCheckpoint('branch-feature');
    client.setHistory(loadedFeature);
    console.log(`   ✅ 已切换到 branch-feature (${loadedFeature.length} 条消息)`);
    
    // 在 feature 分支发送消息
    console.log('   📤 在 feature 分支发送新消息...');
    const featureResponse = await client.sendMessage(
      {
        role: 'user',
        parts: [{ text: '我们讨论了 useState，对吗？' }]
      },
      new AbortController().signal
    );
    
    console.log('   📬 Feature 分支回答:');
    if (featureResponse.candidates && featureResponse.candidates[0]) {
      const text = featureResponse.candidates[0].content.parts[0].text;
      console.log('   ' + text.substring(0, 100) + '...\n');
    }
    
    // ============ 验证结果 ============
    console.log('🧪 验证分支隔离性...');
    
    // Main 分支应该不知道 useState 的讨论
    const mainKnowsUseState = JSON.stringify(mainResponse).toLowerCase().includes('usestate');
    // Feature 分支应该知道 useState
    const featureKnowsUseState = JSON.stringify(featureResponse).toLowerCase().includes('usestate');
    
    console.log(`   Main 分支提到 useState: ${mainKnowsUseState ? '是' : '否'}`);
    console.log(`   Feature 分支提到 useState: ${featureKnowsUseState ? '是' : '否'}`);
    
    if (!mainKnowsUseState && featureKnowsUseState) {
      console.log('\n🎉 分支隔离测试成功！');
      console.log('💡 结论: Checkpoint 机制可以完美实现 GitChat 的分支管理！');
    } else {
      console.log('\n⚠️  分支隔离测试未完全符合预期');
      console.log('💡 但 Checkpoint 保存/加载功能本身是工作的');
    }
    
    // 清理
    console.log('\n🧹 清理测试数据...');
    await logger.deleteCheckpoint('branch-main');
    await logger.deleteCheckpoint('branch-feature');
    console.log('✅ 清理完成');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行测试
test();

