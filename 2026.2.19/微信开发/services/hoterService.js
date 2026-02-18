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

  // 查询酒店详情（新增设施/服务关联）
  async getHotelDetail(id) {
    if (!id || isNaN(parseInt(id))) {
      const error = new Error('酒店ID格式错误');
      error.statusCode = 400;
      throw error;
    }

    const hotel = await db.Hotel.findByPk(id, {
      attributes: { exclude: ['created_at', 'updated_at'] },
      include: [
        // 1. 原有：关联酒店房间
        {
          model: db.HotelRoom,
          as: 'rooms',
          attributes: { exclude: ['created_at', 'updated_at'] }
        },
        // 2. 新增：关联酒店服务
        {
          model: db.HotelService,
          as: 'hotelServices', // 必须和Hotel模型中定义的别名一致
          attributes: ['id', 'name', 'description', 'sort'], // 只返回需要的字段
          through: { attributes: [] }, // 隐藏关联表的冗余字段
          where: { status: 1 }, // 只查启用的服务
          required: false // 没有服务也不影响酒店数据返回
        },
        // 3. 新增：关联酒店设施
        {
          model: db.HotelFacility,
          as: 'hotelFacilities',
          attributes: ['id', 'name', 'icon', 'sort'],
          through: { attributes: [] },
          where: { status: 1 }, // 只查启用的设施
          required: false
        }
      ]
    });

    if (!hotel) {
      const error = new Error('酒店不存在');
      error.statusCode = 404;
      throw error;
    }

    // 兼容前端旧字段：把关联的对象数组转为名称数组
    const hotelData = hotel.toJSON();
    hotelData.facilities = (hotelData.hotelFacilities || []).map(item => item.name);
    hotelData.services = (hotelData.hotelServices || []).map(item => item.name);

    return hotelData;
  }
};

module.exports = hotelService;