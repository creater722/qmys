const db = require('../models');
const { Op } = db.Sequelize;

/**
 * 酒店模块服务层
 */
const hotelService = {
  // 查询酒店列表
  async getHotelList(query) {
    const { city, minPrice, maxPrice, starRating, page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    // 构建筛选条件
    if (city) whereCondition.city = city;
    if (minPrice || maxPrice) {
      whereCondition.min_price = {};
      if (minPrice) whereCondition.min_price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereCondition.min_price[Op.lte] = parseFloat(maxPrice);
    }
    if (starRating) whereCondition.star_rating = parseInt(starRating);

    // 查询数据
    const { count, rows } = await db.Hotel.findAndCountAll({
      where: whereCondition,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['rating', 'DESC']],
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

  // 查询酒店详情
  async getHotelDetail(id) {
    if (!id || isNaN(parseInt(id))) {
      const error = new Error('酒店ID格式错误');
      error.statusCode = 400;
      throw error;
    }

    const hotel = await db.Hotel.findByPk(id, {
      attributes: { exclude: ['created_at', 'updated_at'] },
      include: [
        {
          model: db.HotelRoom,
          as: 'rooms',
          attributes: { exclude: ['created_at', 'updated_at'] }
        }
      ]
    });

    if (!hotel) {
      const error = new Error('酒店不存在');
      error.statusCode = 404;
      throw error;
    }

    return hotel;
  }
};

module.exports = hotelService;