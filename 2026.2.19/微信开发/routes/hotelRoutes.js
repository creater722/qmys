const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Hotel, HotelRoom, HotelService, HotelFacility, UserHotelOrders, UserHotelCollections } = require('../models');

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
        attributes: ['id', 'room_name', 'base_price', 'current_price', 'area', 'bed_type'] 
      }],
      attributes: ['id', 'name', 'city', 'star_rating', 'min_price', 'max_price', 'address', 'phone', 'view_count']
    });

    const formatList = rows.map(item => {
      const hotel = item.toJSON();
      return {
        ...hotel,
        rooms: hotel.rooms?.map(room => ({
          ...room,
          name: room.room_name,
          price: room.current_price
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
    const hotelId = parseInt(req.params.id);
    if (isNaN(hotelId)) {
      return errorResponse(res, '酒店ID格式错误', 400);
    }

    const hotel = await Hotel.findByPk(hotelId, {
      include: [
        { 
          model: HotelRoom, 
          as: 'rooms',
          attributes: ['id', 'room_name', 'base_price', 'current_price', 'area', 'bed_type', 'room_facilities', 'is_active']
        },
        {
          model: HotelService,
          as: 'hotelServices',
          attributes: ['id', 'name', 'description', 'sort'],
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        },
        {
          model: HotelFacility,
          as: 'hotelFacilities',
          attributes: ['id', 'name', 'icon', 'sort'],
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        }
      ],
      attributes: ['id', 'name', 'city', 'star_rating', 'min_price', 'max_price', 'address', 'phone', 'view_count', 'created_at']
    });
    
    if (!hotel) return errorResponse(res, '酒店不存在', 404);

    const newViewCount = (hotel.viewCount || 0) + 1;
    await hotel.update({ view_count: newViewCount });
    
    const hotelJson = hotel.toJSON();
    const formatHotel = {
      ...hotelJson,
      facilities: (hotelJson.hotelFacilities || []).map(item => item.name),
      services: (hotelJson.hotelServices || []).map(item => item.name),
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

/**
 * 我的酒店订单（最终版：适配room_id关联+状态映射）
 * GET /api/hotels/orders/my?userId=15&pageNum=1&pageSize=10
 */
router.get('/orders/my', async (req, res) => {
  try {
    const { userId } = req.query;
    const pageNum = parseInt(req.query.pageNum) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const limitPageSize = Math.min(pageSize, 50);
    
    // 校验参数
    if (!userId || isNaN(parseInt(userId))) {
      return errorResponse(res, 'userId格式错误', 400);
    }

    // ✅ 关键1：明确指定foreignKey，匹配模型的room_id
    const { count, rows } = await UserHotelOrders.findAndCountAll({
      where: { user_id: parseInt(userId) },
      limit: limitPageSize,
      offset: (pageNum - 1) * limitPageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city', 'address', 'phone']
        },
        {
          model: HotelRoom,
          as: 'room',
          foreignKey: 'room_id', // ✅ 明确指定外键，解决关联报错
          attributes: ['id', 'room_name', 'current_price', 'bed_type', 'area']
        }
      ]
    });

    // ✅ 关键2：完善状态映射+空值兜底，适配前端显示
    const formatList = rows.map(item => {
      const order = item.toJSON();
      // 订单状态文字映射（匹配模型的ENUM类型）
      const statusTextMap = {
        'pending': '待支付',
        'paid': '已支付',
        'checked_in': '已入住',
        'checked_out': '已退房',
        'cancelled': '已取消'
      };

      return {
        id: order.id,
        orderNo: order.order_no || '', // 新增：订单编号
        hotelName: order.hotel?.name || '未知酒店',
        roomType: order.room?.room_name || '未知房型',
        checkInDate: order.check_in_date || '',
        checkOutDate: order.check_out_date || '',
        guestCount: order.guest_count || 1, // 新增：入住人数
        price: order.total_price || 0,
        status: order.status || 'pending',
        statusText: statusTextMap[order.status] || '待支付', // 状态文字
        payTime: order.pay_time || '', // 新增：支付时间
        createdAt: order.created_at || new Date().toISOString()
      };
    });

    successResponse(res, {
      list: formatList,
      pagination: {
        total: count,
        pageNum: pageNum,
        pageSize: limitPageSize,
        totalPages: Math.ceil(count / limitPageSize)
      }
    });
  } catch (err) {
    console.error('查询我的酒店订单失败：', err);
    errorResponse(res, '查询订单失败，请重试');
  }
});

/**
 * 我的酒店收藏
 * GET /api/hotels/collections/my?userId=15&pageNum=1&pageSize=10
 */
router.get('/collections/my', async (req, res) => {
  try {
    const { userId } = req.query;
    const pageNum = parseInt(req.query.pageNum) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const limitPageSize = Math.min(pageSize, 50);
    
    if (!userId || isNaN(parseInt(userId))) {
      return errorResponse(res, 'userId格式错误', 400);
    }

    const { count, rows } = await UserHotelCollections.findAndCountAll({
      where: { user_id: parseInt(userId) },
      limit: limitPageSize,
      offset: (pageNum - 1) * limitPageSize,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city', 'address', 'phone', 'cover_image', 'min_price', 'rating']
        }
      ]
    });

    const formatList = rows.map(item => {
      const hotel = item.hotel.toJSON();
      return {
        ...hotel,
        cover_image: hotel.cover_image || '/static/images/default-hotel.jpg',
        rating: hotel.rating || 4.5,
        min_price: hotel.min_price || 0
      };
    });

    successResponse(res, {
      list: formatList,
      pagination: {
        total: count,
        pageNum: pageNum,
        pageSize: limitPageSize,
        totalPages: Math.ceil(count / limitPageSize)
      }
    });
  } catch (err) {
    console.error('查询我的酒店收藏失败：', err);
    errorResponse(res, '查询收藏失败，请重试');
  }
});

module.exports = router;