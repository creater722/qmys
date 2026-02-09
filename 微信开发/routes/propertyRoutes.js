const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { PropertyNotice } = require('../models'); // 导入数据库模型

// 统一响应工具函数
const successResponse = (res, data = null, message = '操作成功') => {
  res.json({ code: 200, message, data });
};

/**
 * 物业公告列表查询（从数据库读取 + 参数校验）
 */
router.get('/notices', async (req, res, next) => {
  try {
    // 核心修复：参数校验 + 容错处理（避免pageSize=-10等异常值）
    let { page = 1, pageSize = 10 } = req.query;
    
    // 1. 转换为数字并处理非数字情况
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 10;
    
    // 2. 确保参数为正整数（关键：修复pageSize=-10的问题）
    page = Math.max(page, 1); // 页码最小为1
    pageSize = Math.max(Math.min(pageSize, 50), 1); // 每页条数1-50之间
    
    // 3. 计算偏移量（避免负数偏移）
    const offset = Math.max((page - 1) * pageSize, 0);

    // 从数据库查询所有记录（包含draft/published）
    const notices = await PropertyNotice.findAll({
      order: [['created_at', 'DESC']], // 按创建时间倒序
      limit: pageSize,
      offset: offset
    });
    const total = await PropertyNotice.count(); // 总记录数

    successResponse(res, {
      list: notices, // 数据库中的所有公告（包括第4条）
      pagination: { 
        total, 
        page: page, 
        pageSize: pageSize, 
        totalPages: Math.ceil(total / pageSize) 
      }
    }, '物业公告列表查询成功');
  } catch (error) {
    console.error('公告查询失败：', error); // 新增：打印错误日志
    next(error);
  }
});

/**
 * 发布物业公告（写入数据库）
 */
router.post('/notices', authenticate, async (req, res, next) => {
  try {
    const { title, content, type = 'notice', status = 'published' } = req.body;
    if (!title || !content) {
      return res.json({ code: 400, message: '标题和内容不能为空' });
    }

    // 写入数据库
    const newNotice = await PropertyNotice.create({
      title,
      content,
      type,
      status,
      publisher_id: req.user?.id || null,
      property_company: '万科物业' // 示例：可从配置/用户信息中获取
    });

    successResponse(res, newNotice, '公告发布成功');
  } catch (error) {
    console.error('发布公告失败：', error);
    next(error);
  }
});

module.exports = router;