const express = require('express');
const router = express.Router();

// ======================== 统一响应工具函数 ========================
const successResponse = (res, data = null, message = '操作成功') => {
  res.json({ code: 200, message, data });
};

const errorResponse = (res, message = '操作失败', code = 500, data = null) => {
  res.status(code).json({ code, message, data });
};

// ======================== 导入数据库模型 ========================
let RepairRequest;
try {
  const db = require('../models');
  RepairRequest = db.RepairRequest || db.repair_requests;
} catch (err) {
  console.warn('⚠️ 模型加载失败（测试环境兼容）：', err.message);
  // 测试环境兜底
  RepairRequest = {
    create: (data) => Promise.resolve({ ...data, id: Math.floor(Math.random() * 10000), status: 'submitted' }),
    findAndCountAll: () => Promise.resolve({ count: 0, rows: [] })
  };
}

/**
 * 提交维修工单（写入repair_requests数据库表）
 * POST /api/repair/orders
 * 前端传参：{ repairType, description, address, contactPhone }
 */
router.post('/orders', async (req, res) => {
  try {
    // 1. 前端参数校验
    const { repairType, description, address, contactPhone } = req.body;
    if (!repairType) return errorResponse(res, '请选择故障类型', 400);
    if (!description || description.length < 2) return errorResponse(res, '故障描述不能少于2个字', 400);
    if (!address || address.length < 5) return errorResponse(res, '维修地址不能少于5个字', 400);
    if (contactPhone && !/^1[3-9]\d{9}$/.test(contactPhone)) {
      return errorResponse(res, '请输入正确的手机号', 400);
    }

    // 2. 构造数据（核心优化：移除冗余的submittedAt，利用模型默认值）
    const requestData = {
      requestNo: `RP${Date.now()}`,        // 匹配模型requestNo（映射request_no）
      userId: req.body.userId || 1,        // 匹配模型userId（映射user_id）
      repairType: repairType,              // 匹配模型repairType（映射repair_type）
      description: description,            // 模型字段
      address: address,                    // 模型字段
      contactPhone: contactPhone || ''     // 匹配模型contactPhone（映射contact_phone）
      // 以下字段模型已配置默认值，无需手动传：
      // urgency: 'normal'（默认）、status: 'submitted'（默认）、submittedAt: 当前时间（默认）
    };

    // 3. 写入数据库
    const newRequest = await RepairRequest.create(requestData);

    // 4. 返回成功响应（返回模型真实的status，而非硬编码）
    successResponse(res, {
      orderNo: newRequest.requestNo,
      orderId: newRequest.id,
      status: newRequest.status // 模型默认值：submitted
    }, '维修工单提交成功');

  } catch (error) {
    console.error('❌ 工单提交失败：', error);
    errorResponse(res, `提交失败：${error.message || '数据库写入异常'}`);
  }
});

/**
 * 查询维修师傅列表（公开接口）
 */
router.get('/workers', async (req, res) => {
  try {
    successResponse(res, {
      list: [],
      pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 }
    }, '维修师傅列表查询成功');
  } catch (error) {
    errorResponse(res, '查询失败：' + error.message);
  }
});

/**
 * 查询我的工单（从repair_requests表读取）
 */
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, userId = 1 } = req.query;

    // 查询条件（匹配模型驼峰字段）
    const query = {
      where: { userId: userId }, // 匹配模型userId（映射user_id）
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['submittedAt', 'DESC']] // 匹配模型submittedAt（映射submitted_at）
    };

    const { count, rows } = await RepairRequest.findAndCountAll(query);

    // 格式化返回数据
    successResponse(res, {
      list: rows.map(item => ({
        orderId: item.id,
        orderNo: item.requestNo,        // 模型驼峰字段
        repairType: item.repairType,    // 模型驼峰字段
        description: item.description,
        address: item.address,
        contactPhone: item.contactPhone,// 模型驼峰字段
        createTime: item.submittedAt,   // 模型驼峰字段
        status: item.status             // 返回模型真实状态，非硬编码
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / parseInt(pageSize))
      }
    }, '我的工单查询成功');

  } catch (error) {
    console.error('❌ 工单查询失败：', error);
    errorResponse(res, '查询失败：' + error.message);
  }
});

module.exports = router;