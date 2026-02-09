const express = require('express');
const router = express.Router();
const db = require('../models');

// 统一响应工具函数
const successResponse = (res, data = null, message = '操作成功') => {
  res.json({ code: 200, message, data });
};

const errorResponse = (res, message = '操作失败', code = 500) => {
  res.status(code).json({ code, message, data: null });
};

/**
 * 项目初始化测试接口
 * GET /test
 */
router.get('/', async (req, res) => {
  try {
    // 测试数据库连接
    await db.sequelize.authenticate();
    
    // 统计各模块数据量
    const [hotels, rentals, workers] = await Promise.all([
      db.Hotel.findAll({ limit: 5 }),
      db.RentalListing.count(),
      db.RepairWorker.count()
    ]);

    successResponse(res, {
      database: 'connected',
      hotelCount: hotels.length,
      rentalCount: rentals,
      repairWorkerCount: workers,
      timestamp: new Date().toISOString()
    }, '项目初始化成功！');
  } catch (error) {
    console.error('测试接口失败：', error.message);
    errorResponse(res, `初始化失败：${error.message}`);
  }
});

module.exports = router;