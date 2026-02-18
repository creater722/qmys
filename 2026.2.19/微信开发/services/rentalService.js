const db = require('../models');
const { Op } = db.Sequelize;

/**
 * 租房模块服务层
 */
const rentalService = {
  // 查询租房房源列表
  async getRentalList(query) {
    const { city, price, roomCount, type, page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    // 构建筛选条件
    if (city) whereCondition.city = city;
    if (price) {
      const [minPrice, maxPrice] = price.split('-').map(Number);
      whereCondition.rent_price = {};
      if (!isNaN(minPrice)) whereCondition.rent_price[Op.gte] = minPrice;
      if (!isNaN(maxPrice)) whereCondition.rent_price[Op.lte] = maxPrice;
    }
    if (roomCount) whereCondition.room_count = parseInt(roomCount);
    if (type) whereCondition.rental_type = type;

    // 查询数据
    const { count, rows } = await db.RentalListing.findAndCountAll({
      where: whereCondition,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['rent_price', 'ASC']],
      attributes: { exclude: ['created_at', 'updated_at', 'publish_time'] }
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

  // 查询租房房源详情
  async getRentalDetail(id) {
    if (!id || isNaN(parseInt(id))) {
      const error = new Error('房源ID格式错误');
      error.statusCode = 400;
      throw error;
    }

    const rental = await db.RentalListing.findByPk(id, {
      attributes: { exclude: ['created_at', 'updated_at'] },
      include: [
        {
          model: db.RentalAppointment,
          as: 'appointments',
          attributes: { exclude: ['created_at', 'updated_at'] }
        }
      ]
    });

    if (!rental) {
      const error = new Error('房源不存在或已下架');
      error.statusCode = 404;
      throw error;
    }

    return rental;
  }
};

module.exports = rentalService;