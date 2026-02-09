const db = require('../models');
const { Op } = db.Sequelize;

/**
 * 物业模块服务层
 */
const propertyService = {
  // 查询物业费账单
  async getPropertyBills(query) {
    const { userId, year, month, page = 1, pageSize = 10 } = query;
    
    // 参数校验
    if (!userId || isNaN(parseInt(userId))) {
      const error = new Error('用户ID格式错误');
      error.statusCode = 400;
      throw error;
    }

    const whereCondition = {
      user_id: parseInt(userId)
    };

    // 构建筛选条件
    if (year) whereCondition.year = parseInt(year);
    if (month) whereCondition.month = parseInt(month);

    // 查询数据
    const { count, rows } = await db.PropertyBill.findAndCountAll({
      where: whereCondition,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['year', 'DESC'], ['month', 'DESC']],
      attributes: { exclude: ['created_at', 'updated_at'] }
    });

    return {
      list: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    };
  },

  // 查询物业公告列表
  async getPropertyNotices(query) {
    const { type, status = 'published', page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    // 构建筛选条件
    if (type) whereCondition.type = type;
    if (status) whereCondition.status = status;

    // 查询数据
    const { count, rows } = await db.PropertyNotice.findAndCountAll({
      where: whereCondition,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['is_top', 'DESC'], ['created_at', 'DESC']],
      attributes: { exclude: ['created_at', 'updated_at'] }
    });

    return {
      list: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    };
  }
};

module.exports = propertyService;