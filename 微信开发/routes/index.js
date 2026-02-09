const express = require('express');
const router = express.Router();

// ==================== 调试日志 ====================
console.log('📌 开始加载路由模块...');

// 导入各模块路由（添加加载日志）
try {
  const testRoutes = require('./testRoutes');
  console.log('✅ testRoutes 模块加载成功');
} catch (error) {
  console.error('❌ testRoutes 模块加载失败：', error.message);
}

try {
  const hotelRoutes = require('./hotelRoutes');
  console.log('✅ hotelRoutes 模块加载成功');
} catch (error) {
  console.error('❌ hotelRoutes 模块加载失败：', error.message);
}

try {
  const rentalRoutes = require('./rentalRoutes');
  console.log('✅ rentalRoutes 模块加载成功');
} catch (error) {
  console.error('❌ rentalRoutes 模块加载失败：', error.message);
}

try {
  const repairRoutes = require('./repairRoutes');
  console.log('✅ repairRoutes 模块加载成功');
} catch (error) {
  console.error('❌ repairRoutes 模块加载失败：', error.message);
}

try {
  const propertyRoutes = require('./propertyRoutes');
  console.log('✅ propertyRoutes 模块加载成功');
} catch (error) {
  console.error('❌ propertyRoutes 模块加载失败：', error.message);
  console.error('💡 检查：1. 文件是否存在 2. 文件名是否正确（如 propertyRoutes.txt → propertyRoutes.js） 3. 文件内是否有语法错误');
}

// 重新导入（确保变量可用）
const testRoutes = require('./testRoutes');
const hotelRoutes = require('./hotelRoutes');
const rentalRoutes = require('./rentalRoutes');
const repairRoutes = require('./repairRoutes');
// 容错处理：如果 propertyRoutes 加载失败，创建空路由
let propertyRoutes;
try {
  propertyRoutes = require('./propertyRoutes');
} catch (error) {
  propertyRoutes = express.Router(); // 创建空路由，避免服务崩溃
  console.warn('⚠️ 使用空路由替代 propertyRoutes');
}

// ==================== 注册路由 ====================
console.log('📌 开始注册路由...');

// 注册路由（统一前缀管理）
router.use('/test', testRoutes);
console.log('✅ 路由注册：/test → testRoutes');

router.use('/api/hotels', hotelRoutes);
console.log('✅ 路由注册：/api/hotels → hotelRoutes');

router.use('/api/rentals', rentalRoutes);
console.log('✅ 路由注册：/api/rentals → rentalRoutes');

router.use('/api/repair', repairRoutes);
console.log('✅ 路由注册：/api/repair → repairRoutes');

router.use('/api/property', propertyRoutes);
console.log('✅ 路由注册：/api/property → propertyRoutes');

// 简化的路由列表打印
console.log('\n📋 已注册的核心路由：');
console.log('  - GET /test');
console.log('  - GET /api/hotels | GET /api/hotels/:id');
console.log('  - GET /api/rentals | GET /api/rentals/:id');
console.log('  - POST /api/repair/orders | GET /api/repair/workers');
console.log('  - GET /api/property/bills | GET /api/property/notices');

console.log('\n✅ 所有路由注册完成！');

module.exports = router;