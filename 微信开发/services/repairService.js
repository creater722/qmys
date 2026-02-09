const db = require('../models');
const { Op } = db.Sequelize;

/**
 * 生成唯一工单号
 */
const generateOrderNo = () => {
  const date = new Date();
  const prefix = 'RP';
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  const timestamp = date.getTime().toString().slice(-4);
  return `${prefix}${dateStr}${random}${timestamp}`;
};

/**
 * 维修模块服务层
 */
const repairService = {
  // 创建维修工单
  async createRepairOrder(orderData) {
    const {
      userId, repairType, subType, urgency = 'normal',
      title, description, address, longitude, latitude,
      contactName, contactPhone, bestTime, images,
      videoUrl, estimatedCost, remark
    } = orderData;

    // 参数校验
    const requiredFields = [
      { name: 'userId', value: userId, msg: '报修用户ID' },
      { name: 'repairType', value: repairType, msg: '故障类型' },
      { name: 'description', value: description, msg: '问题详细描述' },
      { name: 'address', value: address, msg: '维修地址' },
      { name: 'contactPhone', value: contactPhone, msg: '联系人电话' }
    ];

    for (const field of requiredFields) {
      if (!field.value) {
        const error = new Error(`请填写${field.msg}`);
        error.statusCode = 400;
        throw error;
      }
    }

    // 构建工单数据
    const data = {
      user_id: userId,
      repair_type: repairType,
      sub_type: subType || null,
      urgency: ['low', 'normal', 'high', 'urgent'].includes(urgency) ? urgency : 'normal',
      title: title || null,
      description,
      address,
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      contact_name: contactName || null,
      contact_phone: contactPhone,
      best_time: bestTime || null,
      images: images ? (Array.isArray(images) ? images : JSON.parse(images)) : null,
      video_url: videoUrl || null,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      remark: remark || null,
      order_no: generateOrderNo(),
      status: 'pending',
      submitted_at: new Date()
    };

    // 创建工单
    const order = await db.RepairRequest.create(data);
    return {
      orderNo: order.order_no,
      orderId: order.id,
      status: order.status,
      submittedAt: order.submitted_at,
      data: order
    };
  },

  // 查询维修师傅列表
  async getRepairWorkers(query) {
    const { type, city, page = 1, pageSize = 10 } = query;
    const whereCondition = {};

    // 构建筛选条件
    if (type) whereCondition.repair_type = type;
    if (city) whereCondition.city = city;

    // 查询数据
    const { count, rows } = await db.RepairWorker.findAndCountAll({
      where: whereCondition,
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      order: [['rating', 'DESC']],
      attributes: { exclude: ['created_at', 'updated_at', 'password'] }
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

module.exports = repairService;