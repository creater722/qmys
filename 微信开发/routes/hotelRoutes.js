const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Hotel, HotelRoom } = require('../models');

const successResponse = (res, data = null, message = '操作成功') => {
  res.json({ code: 200, message, data });
};

const errorResponse = (res, message = '操作失败', code = 500) => {
  res.status(code).json({ code, message });
};

/**
 * 酒店列表（支持搜索、筛选）
 * GET /api/hotels?city=北京&starRating=3&minPrice=200&maxPrice=500
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, city, starRating, minPrice, maxPrice, keyword } = req.query;
    
    // 构建查询条件
    const where = { is_active: 1 };
    
    if (city) where.city = city;
    if (starRating) where.star_rating = starRating;
    if (minPrice) where.min_price = { [Op.gte]: parseInt(minPrice) };
    if (maxPrice) where.max_price = { [Op.lte]: parseInt(maxPrice) };
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Hotel.findAndCountAll({
      where,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['view_count', 'DESC']],
      include: [{ 
        model: HotelRoom, 
        as: 'rooms', 
        limit: 2,
        // 核心修复：使用 hotel_rooms 表真实字段
        attributes: ['id', 'room_name', 'base_price', 'current_price', 'area', 'bed_type'] 
      }],
      attributes: ['id', 'name', 'city', 'star_rating', 'min_price', 'max_price', 'address', 'phone', 'view_count']
    });

    // 字段映射：适配前端需要的 name 和 price
    const formatList = rows.map(item => {
      const hotel = item.toJSON();
      return {
        ...hotel,
        rooms: hotel.rooms?.map(room => ({
          ...room,
          name: room.room_name,       // room_name → name
          price: room.current_price    // current_price → price（前端展示用）
        })) || []
      };
    });

    successResponse(res, {
      list: formatList,
      pagination: { total: count, page: parseInt(page), pageSize: parseInt(pageSize) }
    });
  } catch (err) {
    console.error('酒店列表查询失败：', err);
    errorResponse(res, err.message);
  }
});

/**
 * 酒店详情
 * GET /api/hotels/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ 
        model: HotelRoom, 
        as: 'rooms',
        // 核心修复：使用 hotel_rooms 表真实字段
        attributes: ['id', 'room_name', 'base_price', 'current_price', 'area', 'bed_type', 'room_facilities', 'is_active']
      }],
      attributes: ['id', 'name', 'city', 'star_rating', 'min_price', 'max_price', 'address', 'phone', 'view_count', 'description', 'created_at']
    });
    
    if (!hotel) return errorResponse(res, '酒店不存在', 404);

    await hotel.update({ view_count: (hotel.view_count || 0) + 1 });
    
    // 字段映射：适配前端需要的 name 和 price
    const hotelJson = hotel.toJSON();
    const formatHotel = {
      ...hotelJson,
      rooms: hotelJson.rooms?.map(room => ({
        ...room,
        name: room.room_name,
        price: room.current_price
      })) || []
    };

    successResponse(res, formatHotel);
  } catch (err) {
    console.error('酒店详情查询失败：', err);
    errorResponse(res, err.message);
  }
});

module.exports = router;