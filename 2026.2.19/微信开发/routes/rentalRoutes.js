const express = require('express');
const router = express.Router();
const { RentalListing } = require('../models'); // 对应 rental_listings 表

const successResponse = (res, data = null, message = '操作成功') => {
  res.json({ code: 200, message, data });
};

const errorResponse = (res, message = '操作失败', code = 500, data = null) => {
  res.status(code).json({ code, message, data });
};

/**
 * 获取租房列表（分页）
 * GET /api/rentals/list?page=1&pageSize=10
 */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const { count, rows } = await RentalListing.findAndCountAll({
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['refresh_time', 'DESC']] // 按刷新时间倒序
    });

    successResponse(res, {
      list: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / parseInt(pageSize))
      }
    });
  } catch (err) {
    errorResponse(res, '获取租房列表失败：' + err.message);
  }
});

/**
 * 获取租房详情
 * GET /api/rentals/detail/:id
 */
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await RentalListing.findByPk(id);
    if (!listing) {
      return errorResponse(res, '房源不存在', 404);
    }
    successResponse(res, listing);
  } catch (err) {
    errorResponse(res, '获取房源详情失败：' + err.message);
  }
});

module.exports = router;