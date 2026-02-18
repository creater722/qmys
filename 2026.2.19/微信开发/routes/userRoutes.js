const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
// 导入所有需要的模型（包含订单、房型）
const { UserModel: User, UserHotelCollections, Hotel, HotelRoom, UserHotelOrders, Op } = require('../models');

// 统一JWT密钥（和authMiddleware.js保持一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123456';

// ===================== 基础登录/验证码接口 =====================
/**
 * 发送验证码接口
 * POST /api/user/send-code
 */
router.post('/send-code', (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(200).json({
        code: 400,
        message: '手机号不能为空'
      });
    }
    console.log(`向手机号 ${phone} 发送验证码：123456`);
    res.status(200).json({
      code: 200,
      message: '验证码已发送',
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 微信登录接口
 * POST /api/user/wechat-login
 */
router.post('/wechat-login', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;
    if (!code || !userInfo) {
      return res.status(200).json({
        code: 400,
        message: '参数不全'
      });
    }

    // 模拟微信openid（真实项目需调用微信官方接口）
    const openid = 'test_openid_' + Date.now();

    // 查找/创建微信用户
    const [user, created] = await User.findOrCreate({
      where: { openid },
      defaults: {
        phone: `wx_${openid.slice(-6)}`,
        nickname: userInfo.nickName || `微信用户${openid.slice(-4)}`,
        status: 1
      }
    });

    // 生成JWT Token
    const token = jwt.sign(
      { id: user.id, openid: openid, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      code: 200,
      message: created ? '微信登录成功（新用户）' : '微信登录成功',
      data: {
        token: token,
        userId: user.id,
        openid: openid,
        nickname: user.nickname
      }
    });
  } catch (err) {
    console.error('微信登录失败：', err);
    next(err);
  }
});

/**
 * 手机号登录接口
 * POST /api/user/phone-login
 */
router.post('/phone-login', async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(200).json({
        code: 400,
        message: '手机号/验证码不能为空'
      });
    }

    // 验证码校验（测试用，真实场景对接短信服务商）
    if (code !== '123456') {
      return res.status(200).json({
        code: 400,
        message: '验证码错误'
      });
    }

    // 查找/创建手机号用户
    const [user, created] = await User.findOrCreate({
      where: { phone },
      defaults: {
        nickname: `用户${phone.slice(-4)}`,
        status: 1
      }
    });

    // 生成JWT Token
    const token = jwt.sign(
      { id: user.id, phone: phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      code: 200,
      message: created ? '登录成功（新用户）' : '登录成功',
      data: {
        token: token,
        userId: user.id,
        phone: phone,
        nickname: user.nickname
      }
    });
  } catch (err) {
    console.error('手机号登录失败：', err);
    next(err);
  }
});

/**
 * 测试接口 - 根据token获取用户信息
 * GET /api/user/info
 */
router.get('/info', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(200).json({
        code: 401,
        message: '未登录'
      });
    }

    // 解析token获取用户ID
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'phone', 'nickname', 'created_at']
    });

    res.status(200).json({
      code: 200,
      data: {
        userId: user.id,
        phone: user.phone,
        nickname: user.nickname,
        createTime: user.created_at
      }
    });
  } catch (err) {
    res.status(200).json({
      code: 401,
      message: 'token无效或已过期'
    });
  }
});

// ===================== 酒店收藏接口 =====================
/**
 * 收藏酒店
 * POST /api/user/favorites/add
 */
router.post('/favorites/add', async (req, res, next) => {
  try {
    const { userId, favType, targetId } = req.body;
    // 参数校验
    if (!userId || !targetId || favType !== 'hotel') {
      return res.status(200).json({
        code: 400,
        message: '参数错误（需传入userId、favType=hotel、targetId）'
      });
    }

    // 检查酒店是否存在
    const hotel = await Hotel.findByPk(targetId);
    if (!hotel) {
      return res.status(200).json({
        code: 404,
        message: '酒店不存在'
      });
    }

    // 检查是否已收藏
    const existing = await UserHotelCollections.findOne({
      where: { user_id: userId, hotel_id: targetId }
    });
    if (existing) {
      return res.status(200).json({
        code: 400,
        message: '已收藏该酒店'
      });
    }

    // 创建收藏记录
    await UserHotelCollections.create({
      user_id: userId,
      hotel_id: targetId,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(200).json({
      code: 200,
      message: '收藏成功',
      data: {}
    });
  } catch (err) {
    console.error('收藏酒店失败：', err);
    next(err);
  }
});

/**
 * 取消收藏酒店
 * POST /api/user/favorites/cancel
 */
router.post('/favorites/cancel', async (req, res, next) => {
  try {
    const { userId, favType, targetId } = req.body;
    // 参数校验
    if (!userId || !targetId || favType !== 'hotel') {
      return res.status(200).json({
        code: 400,
        message: '参数错误（需传入userId、favType=hotel、targetId）'
      });
    }

    // 删除收藏记录
    const result = await UserHotelCollections.destroy({
      where: { user_id: userId, hotel_id: targetId }
    });

    if (result === 0) {
      return res.status(200).json({
        code: 404,
        message: '未找到收藏记录'
      });
    }

    res.status(200).json({
      code: 200,
      message: '取消收藏成功',
      data: {}
    });
  } catch (err) {
    console.error('取消收藏酒店失败：', err);
    next(err);
  }
});

/**
 * 检查酒店收藏状态
 * POST /api/user/favorites/check
 */
router.post('/favorites/check', async (req, res, next) => {
  try {
    const { userId, favType, targetId } = req.body;
    // 参数校验
    if (!userId || !targetId || favType !== 'hotel') {
      return res.status(200).json({
        code: 400,
        message: '参数错误（需传入userId、favType=hotel、targetId）'
      });
    }

    // 查询收藏状态
    const existing = await UserHotelCollections.findOne({
      where: { user_id: userId, hotel_id: targetId }
    });

    // 直接返回布尔值（适配前端）
    res.status(200).json({
      code: 200,
      message: '查询成功',
      data: !!existing
    });
  } catch (err) {
    console.error('检查收藏状态失败：', err);
    next(err);
  }
});

/**
 * 获取用户收藏的酒店列表
 * POST /api/user/favorites/list
 */
router.post('/favorites/list', async (req, res, next) => {
  try {
    const { userId, favType = 'hotel' } = req.body;

    // 参数校验
    if (!userId) {
      return res.status(200).json({
        code: 400,
        message: '用户ID不能为空',
        data: null
      });
    }

    if (favType !== 'hotel') {
      return res.status(200).json({
        code: 400,
        message: '暂仅支持酒店收藏类型',
        data: null
      });
    }

    // 查询收藏列表并关联酒店信息
    const favorites = await UserHotelCollections.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'coverImage', 'starRating', 'rating', 'address', 'phone']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回数据
    const formattedList = favorites.map(item => ({
      id: item.id,
      hotelId: item.hotel_id,
      collectTime: item.created_at,
      hotel: item.hotel || null
    }));

    res.status(200).json({
      code: 200,
      message: '获取收藏列表成功',
      data: {
        total: formattedList.length,
        list: formattedList
      }
    });

  } catch (err) {
    console.error('获取收藏列表失败：', err);
    next(err);
  }
});

// ===================== 酒店预订（订单）接口（终极修复版） =====================
/**
 * 创建酒店订单（终极修复版：直接使用数据库字段名）
 * POST /api/user/orders/create
 */
router.post('/orders/create', async (req, res, next) => {
  try {
    const {
      userId,
      hotelId,
      roomId,
      checkIn,
      checkOut,
      contactName,
      contactPhone,
      guestCount = 1,
      remark = '',
      totalPrice = 0
    } = req.body;

    // 1. 基础参数校验
    const requiredFields = ['userId', 'hotelId', 'roomId', 'checkIn', 'checkOut', 'contactName', 'contactPhone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(200).json({
        code: 400,
        message: `参数不全：缺少 ${missingFields.join('、')}`,
        data: null
      });
    }

    // 2. 日期逻辑校验
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      return res.status(200).json({
        code: 400,
        message: '退房日期必须晚于入住日期',
        data: null
      });
    }

    // 3. 强制转换ID为数字（关键：和数据库主键类型匹配）
    const numericHotelId = parseInt(hotelId, 10);
    const numericRoomId = parseInt(roomId, 10);
    if (isNaN(numericHotelId) || isNaN(numericRoomId)) {
      return res.status(200).json({
        code: 400,
        message: '酒店ID/房型ID必须是有效数字',
        data: null
      });
    }

    // 4. 查询酒店信息（仅校验存在，获取名称/封面）
    const hotel = await Hotel.findByPk(numericHotelId, {
      attributes: ['id', 'name', 'coverImage']
    });
    if (!hotel) {
      return res.status(200).json({
        code: 404,
        message: '酒店不存在',
        data: null
      });
    }

    // 5. 查询房型信息（核心：直接使用数据库字段名，绕过模型映射）
    const room = await HotelRoom.findByPk(numericRoomId, {
      attributes: ['id', 'room_type', 'price'] // 明确指定要查询的数据库字段名
    });
    if (!room) {
      return res.status(200).json({
        code: 404,
        message: '房型不存在',
        data: null
      });
    }

    // 直接从查询结果的 dataValues 中获取原始数据库值，绕过模型 getter
    const roomTypeName = room.dataValues.room_type || '默认房型';
    const roomPriceNum = parseFloat(room.dataValues.price) || 0;

    // 打印关键信息（调试用）
    console.log('【关键调试信息】', {
      数据库原始返回: room.dataValues, // 打印从数据库直接获取的原始数据
      最终取到的房型名称: roomTypeName,
      最终取到的房型价格: roomPriceNum
    });

    // 6. 计算最终总价（使用数据库的真实价格）
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const finalPrice = days * roomPriceNum;

    // 7. 生成唯一订单号
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();

    // 8. 创建订单记录（核心：使用从数据库直接获取的房型名称）
    let order = null;
    const orderData = {
      order_no: orderNo,
      user_id: userId,
      hotel_id: numericHotelId,
      hotel_name: hotel.name || '未知酒店',
      hotel_cover: hotel.coverImage || '',
      room_id: numericRoomId,
      room_type: roomTypeName, // 直接使用从数据库获取的房型名称
      check_in_date: checkIn,
      check_out_date: checkOut,
      guest_count: parseInt(guestCount, 10) || 1,
      contact_name: contactName,
      contact_phone: contactPhone,
      total_price: finalPrice,
      currency: 'CNY',
      pay_status: 0,
      order_status: 0,
      remark: remark,
      created_at: new Date(),
      updated_at: new Date()
    };

    // 兼容data_status/status字段
    try {
      orderData.data_status = 1;
      order = await UserHotelOrders.create(orderData);
    } catch (err) {
      if (err.message.includes('data_status')) {
        delete orderData.data_status;
        orderData.status = 1;
        order = await UserHotelOrders.create(orderData);
      } else {
        throw err;
      }
    }

    // 打印最终创建的订单数据
    console.log('【最终创建的订单数据】', order ? order.toJSON() : '创建失败');

    // 9. 返回响应
    res.status(200).json({
      code: 200,
      message: '订单创建成功',
      data: {
        orderId: order.id,
        orderNo: orderNo,
        roomType: roomTypeName, // 返给前端确认房型名称
        totalPrice: finalPrice,
        orderStatus: 0,
        orderStatusText: '待支付',
        payStatus: 0
      }
    });

  } catch (err) {
    console.error('创建订单失败（全局异常）：', err);
    // 开发环境返回详细错误
    res.status(200).json({
      code: 500,
      message: '服务器内部错误，请稍后重试',
      data: process.env.NODE_ENV === 'development' ? {
        error: err.message,
        sql: err.sql,
        stack: err.stack.substring(0, 200) // 截取部分栈信息，避免过长
      } : {}
    });
  }
});/**
 * 获取用户订单列表（不分页）
 */
router.post('/orders/list', async (req, res, next) => {
  try {
    const { userId, orderStatus } = req.body;

    if (!userId) {
      return res.status(200).json({
        code: 400,
        message: '用户ID不能为空',
        data: null
      });
    }

    // 构建查询条件：兼容 data_status 和 status
    const where = { user_id: userId };
    try {
      // 先查 data_status
      where.data_status = 1;
      await UserHotelOrders.findOne({ where, limit: 1 });
    } catch (err) {
      // 没有 data_status 则用 status
      delete where.data_status;
      where.status = 1;
    }

    if (orderStatus !== undefined && orderStatus !== '' && !isNaN(orderStatus)) {
      where.order_status = orderStatus;
    }

    // 查询订单（只关联必要字段，避免报错）
    const orders = await UserHotelOrders.findAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'coverImage', 'starRating', 'address']
        },
        {
          model: HotelRoom,
          as: 'room',
          attributes: ['id', 'room_type', 'price']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // 格式化返回（修复字段名，和前端保持一致）
    const formattedList = orders.map(item => ({
      id: item.id,
      order_no: item.order_no,
      hotel_id: item.hotel_id,
      hotel_name: item.hotel_name || item.hotel?.name || '未知酒店',
      hotel_cover: item.hotel_cover || item.hotel?.coverImage || '',
      room_id: item.room_id,
      room_type: item.room_type || item.room?.room_type || '未知房型',
      check_in_date: item.check_in_date,
      check_out_date: item.check_out_date,
      guest_count: item.guest_count,
      contact_name: item.contact_name || '',
      contact_phone: item.contact_phone || '',
      total_price: item.total_price,
      currency: item.currency || 'CNY',
      order_status: item.order_status,
      pay_status: item.pay_status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      hotel: item.hotel || null,
      room: item.room || null
    }));

    res.status(200).json({
      code: 200,
      message: '获取订单列表成功',
      data: {
        total: formattedList.length,
        list: formattedList
      }
    });
  } catch (err) {
    console.error('获取订单列表失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器内部错误',
      data: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
});

/**
 * 获取我的酒店订单（支持分页）
 */
router.post('/orders/my', async (req, res, next) => {
  try {
    const { userId, pageNum = 1, pageSize = 10, orderStatus } = req.body;

    if (!userId) {
      return res.status(200).json({
        code: 400,
        message: '用户ID不能为空',
        data: null
      });
    }

    const page = parseInt(pageNum, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (page - 1) * size;
    const limit = size;

    // 兼容查询条件
    const where = { user_id: userId };
    try {
      where.data_status = 1;
      await UserHotelOrders.findOne({ where, limit: 1 });
    } catch (err) {
      delete where.data_status;
      where.status = 1;
    }

    if (orderStatus !== undefined && orderStatus !== '' && !isNaN(orderStatus)) {
      where.order_status = orderStatus;
    }

    // 分页查询
    const { count, rows } = await UserHotelOrders.findAndCountAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'coverImage', 'starRating', 'address']
        },
        {
          model: HotelRoom,
          as: 'room',
          attributes: ['id', 'room_type', 'price']
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    // 格式化（核心：优先使用订单表自身的room_type）
    const formattedList = rows.map(item => ({
      id: item.id,
      order_no: item.order_no,
      user_id: item.user_id,
      hotel_id: item.hotel_id,
      hotel_name: item.hotel_name || item.hotel?.name || '未知酒店',
      hotel_cover: item.hotel_cover || item.hotel?.coverImage || '',
      room_id: item.room_id,
      room_type: item.room_type || item.room?.room_type || '未知房型',
      check_in_date: item.check_in_date,
      check_out_date: item.check_out_date,
      guest_count: item.guest_count,
      contact_name: item.contact_name || '',
      contact_phone: item.contact_phone || '',
      total_price: item.total_price,
      currency: item.currency || 'CNY',
      order_status: item.order_status,
      pay_status: item.pay_status,
      created_at: item.created_at,
      updated_at: item.updated_at,
      hotel: item.hotel || null,
      room: item.room || null
    }));

    res.status(200).json({
      code: 200,
      message: '获取我的订单成功',
      data: {
        total: count,
        list: formattedList,
        pageNum: page,
        pageSize: size,
        totalPages: Math.ceil(count / size)
      }
    });
  } catch (err) {
    console.error('查询我的订单（分页）失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器内部错误',
      data: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
});

/**
 * 获取订单详情
 */
router.post('/orders/detail', async (req, res, next) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(200).json({
        code: 400,
        message: 'orderId 和 userId 不能为空',
        data: null
      });
    }

    // 兼容查询条件
    const where = { id: orderId, user_id: userId };
    try {
      where.data_status = 1;
    } catch (err) {
      where.status = 1;
    }

    const order = await UserHotelOrders.findOne({
      where,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'coverImage', 'starRating', 'rating', 'address', 'phone']
        },
        {
          model: HotelRoom,
          as: 'room',
          attributes: ['id', 'room_type', 'price']
        }
      ]
    });

    if (!order) {
      return res.status(200).json({
        code: 404,
        message: '订单不存在或无权访问',
        data: null
      });
    }

    // 格式化返回（下划线字段）
    res.status(200).json({
      code: 200,
      message: '获取订单详情成功',
      data: {
        id: order.id,
        order_no: order.order_no,
        hotel_id: order.hotel_id,
        hotel_name: order.hotel_name || order.hotel?.name || '未知酒店',
        hotel_cover: order.hotel_cover || order.hotel?.coverImage || '',
        room_id: order.room_id,
        room_type: order.room_type || order.room?.room_type || '未知房型',
        check_in_date: order.check_in_date,
        check_out_date: order.check_out_date,
        guest_count: order.guest_count,
        contact_name: order.contact_name || '',
        contact_phone: order.contact_phone || '',
        total_price: order.total_price,
        currency: order.currency || 'CNY',
        order_status: order.order_status,
        order_status_text: getOrderStatusText(order.order_status),
        pay_status: order.pay_status,
        pay_time: order.pay_time,
        cancel_time: order.cancel_time,
        complete_time: order.complete_time,
        remark: order.remark,
        created_at: order.created_at,
        updated_at: order.updated_at,
        hotel: order.hotel || null,
        room: order.room || null
      }
    });
  } catch (err) {
    console.error('获取订单详情失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器内部错误',
      data: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
});

/**
 * 取消订单
 */
router.post('/orders/cancel', async (req, res, next) => {
  try {
    const { orderId, userId } = req.body;

    if (!orderId || !userId) {
      return res.status(200).json({
        code: 400,
        message: 'orderId 和 userId 不能为空',
        data: null
      });
    }

    // 兼容查询条件
    const where = { id: orderId, user_id: userId };
    try {
      where.data_status = 1;
    } catch (err) {
      where.status = 1;
    }

    const order = await UserHotelOrders.findOne({ where });

    if (!order) {
      return res.status(200).json({
        code: 404,
        message: '订单不存在',
        data: null
      });
    }

    if (order.order_status !== 0) {
      return res.status(200).json({
        code: 400,
        message: `当前订单状态为${getOrderStatusText(order.order_status)}，仅待支付订单可取消`,
        data: null
      });
    }

    await order.update({
      order_status: 2,
      cancel_time: new Date(),
      updated_at: new Date()
    });

    res.status(200).json({
      code: 200,
      message: '订单取消成功',
      data: {
        orderId: order.id,
        order_status: 2,
        order_status_text: getOrderStatusText(2)
      }
    });
  } catch (err) {
    console.error('取消订单失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器内部错误',
      data: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  }
});

/**
 * 辅助函数：订单状态转文本
 */
function getOrderStatusText(status) {
  const statusMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已完成'
  };
  return statusMap[status] || '未知状态';
}

// ===================== 全局错误处理 =====================
router.use((err, req, res, next) => {
  console.error('用户接口全局错误：', err);
  res.status(200).json({
    code: 500,
    message: '服务器内部错误，请稍后重试',
    data: process.env.NODE_ENV === 'development' ? {
      error: err.message,
      sql: err.sql || '',
      stack: err.stack || ''
    } : {}
  });
});

module.exports = router;