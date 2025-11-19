/**
 * 性能诊断脚本
 * 使用方法: node scripts/diagnose-performance.js
 */

const https = require('https');
const http = require('http');

// 配置
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_DATE = '2025-11-12';

console.log('🔍 开始性能诊断...\n');

// 测试API响应时间
async function testAPIEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const startTime = Date.now();
    
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        let status = '✅';
        let comment = '良好';
        
        if (duration > 2000) {
          status = '❌';
          comment = '非常慢';
        } else if (duration > 1000) {
          status = '⚠️';
          comment = '较慢';
        } else if (duration > 500) {
          status = '⚡';
          comment = '一般';
        }
        
        console.log(`${status} ${description}`);
        console.log(`   响应时间: ${duration}ms (${comment})`);
        console.log(`   状态码: ${res.statusCode}`);
        console.log(`   数据大小: ${(data.length / 1024).toFixed(2)} KB\n`);
        
        resolve({ duration, size: data.length, status: res.statusCode });
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}`);
      console.log(`   错误: ${err.message}\n`);
      resolve({ duration: -1, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`❌ ${description}`);
      console.log(`   错误: 请求超时\n`);
      resolve({ duration: -1, error: 'timeout' });
    });
  });
}

// 主诊断函数
async function diagnose() {
  console.log('📊 测试API端点性能:\n');
  console.log('='.repeat(50));
  
  const results = [];
  
  // 测试各个API端点
  results.push(await testAPIEndpoint('/api/meals?date=' + TEST_DATE, 'GET /api/meals'));
  results.push(await testAPIEndpoint('/api/analytics?timeframe=本周', 'GET /api/analytics'));
  
  console.log('='.repeat(50));
  console.log('\n📈 性能总结:\n');
  
  const validResults = results.filter(r => r.duration > 0);
  if (validResults.length === 0) {
    console.log('❌ 无法连接到服务器，请确保应用正在运行');
    console.log('   运行命令: npm run dev');
    return;
  }
  
  const avgDuration = validResults.reduce((sum, r) => sum + r.duration, 0) / validResults.length;
  const maxDuration = Math.max(...validResults.map(r => r.duration));
  
  console.log(`平均响应时间: ${avgDuration.toFixed(0)}ms`);
  console.log(`最慢响应时间: ${maxDuration}ms`);
  
  // 给出建议
  console.log('\n💡 优化建议:\n');
  
  if (maxDuration > 2000) {
    console.log('1. ❗ API响应非常慢 (>2秒)');
    console.log('   - 检查数据库查询是否有索引');
    console.log('   - 考虑添加缓存层');
    console.log('   - 检查Supabase网络连接');
  } else if (maxDuration > 1000) {
    console.log('1. ⚠️  API响应较慢 (>1秒)');
    console.log('   - 建议添加数据库索引');
    console.log('   - 考虑使用SWR缓存');
  } else if (maxDuration > 500) {
    console.log('1. ⚡ API响应一般 (>500ms)');
    console.log('   - 可以通过SWR缓存进一步优化');
  } else {
    console.log('1. ✅ API响应速度良好');
  }
  
  console.log('\n2. 建议实施的优化:');
  console.log('   ✓ 安装SWR进行数据缓存: npm install swr');
  console.log('   ✓ 添加数据库索引（见PERFORMANCE_OPTIMIZATION.md）');
  console.log('   ✓ 启用图片优化');
  
  console.log('\n3. 下一步诊断:');
  console.log('   - 打开浏览器开发者工具 (F12)');
  console.log('   - 切换到Network标签');
  console.log('   - 刷新页面查看详细的网络请求');
  console.log('   - 运行Lighthouse测试获取综合评分');
}

// 运行诊断
diagnose().catch(console.error);
