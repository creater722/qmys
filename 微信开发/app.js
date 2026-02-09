require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 1. 核心初始化（无延迟，同步加载）
const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // 确保局域网可访问

// 2. 基础中间件（跨域放最前面，兼容小程序OPTIONS请求）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 适配图片上传
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. 同步加载数据库（无延迟，避免路由注册时数据库未就绪）
let db;
try {
  db = require('./models');
  // 验证数据库连接（同步执行，确保启动前连接完成）
  db.sequelize.authenticate().then(() => {
    console.log('\n✅ 数据库连接成功！');
  }).catch(err => {
    console.error('❌ 数据库连接失败：', err.message);
  });
} catch (err) {
  console.error('❌ 模型加载失败：', err.message);
}

// 4. 注册所有必要路由（恢复用户/物业/酒店/租房模块）
// 核心：补充小程序请求的 /api/send-code /api/property/notices 等路由
const userRoutes = require('./routes/userRoutes'); // 验证码/登录
const repairRoutes = require('./routes/repairRoutes'); // 维修工单
const propertyRoutes = require('./routes/propertyRoutes'); // 物业通知/账单
const hotelRoutes = require('./routes/hotelRoutes'); // 酒店模块
const rentalRoutes = require('./routes/rentalRoutes'); // 租房模块

app.use('/api', userRoutes); // 用户模块：/api/send-code、/api/phone-login
app.use('/api/repair', repairRoutes); // 维修模块：/api/repair/orders
app.use('/api/property', propertyRoutes); // 物业模块：/api/property/notices
app.use('/api/hotels', hotelRoutes); // 酒店模块：/api/hotels
app.use('/api/rentals', rentalRoutes); // 租房模块：/api/rentals

// 5. 测试接口（保留）
app.get('/test', (req, res) => {
  res.json({ code: 200, message: '服务正常运行', data: { time: new Date() } });
});

// 6. 404兜底（友好提示）
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在：${req.method} ${req.originalUrl}`,
    data: null
  });
});

// 7. 启动服务（无延迟，同步执行）
app.listen(port, host, () => {
  console.log(`✅ 服务启动成功：http://localhost:${port}/test`);
  console.log(`✅ 局域网访问：http://192.168.48.1:${port}/test`); // 替换为你的IP
  console.log('\n📚 所有可用接口：');
  console.log(`  ├─ 用户模块：POST /api/send-code | POST /api/phone-login`);
  console.log(`  ├─ 维修模块：POST /api/repair/orders | GET /api/repair/orders`);
  console.log(`  ├─ 物业模块：GET /api/property/notices | GET /api/property/bills`);
  console.log(`  ├─ 酒店模块：GET /api/hotels`);
  console.log(`  └─ 租房模块：GET /api/rentals`);
});

module.exports = app;