/**
 * 用户酒店订单表模型
 * 关联：用户-酒店-房间 订单关系
 */
module.exports = (sequelize, DataTypes) => {
  // 定义模型
  const UserHotelOrders = sequelize.define('UserHotelOrders', {
    // 主键ID
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    // 用户ID
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    // 酒店ID
    hotel_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '酒店ID',
      references: {
        model: 'hotels',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    // 房间ID（模型和数据库现在一致了）
    room_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '房间ID',
      references: {
        model: 'hotel_rooms',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    // 订单编号（唯一）
    order_no: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      comment: '订单编号（例如：ORDER20260216001）'
    },
    // 房型名称（补充：和数据库表结构对齐）
    room_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '房型名称'
    },
    // 入住日期
    check_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '入住日期（YYYY-MM-DD）'
    },
    // 退房日期
    check_out_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '退房日期（YYYY-MM-DD）'
    },
    // 入住人数
    guest_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 1,
      comment: '入住人数',
      allowNull: false
    },
    // 订单总价
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '订单总价（元）'
    },
    // 货币类型（补充：和数据库表结构对齐）
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'CNY',
      allowNull: false,
      comment: '货币类型（默认CNY）'
    },
    // 支付状态（补充：和数据库表结构对齐）
    pay_status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
      comment: '支付状态 0-未支付 1-已支付'
    },
    // 订单状态（核心修正：从枚举改为数字，适配接口+数据库）
    order_status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      allowNull: false,
      comment: '订单状态 0-待支付 1-已支付 2-已取消 3-已完成'
    },
    // 支付时间
    pay_time: {
      type: DataTypes.DATE,
      comment: '支付时间',
      allowNull: true
    },
    // 取消时间
    cancel_time: {
      type: DataTypes.DATE,
      comment: '取消时间',
      allowNull: true
    },
    // 完成时间（补充：和数据库表结构对齐）
    complete_time: {
      type: DataTypes.DATE,
      comment: '完成时间',
      allowNull: true
    },
    // 联系电话（补充：和数据库表结构对齐）
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '联系电话'
    },
    // 备注（补充：和数据库表结构对齐）
    remark: {
      type: DataTypes.STRING(500),
      comment: '订单备注',
      allowNull: true
    },
    // 数据状态（补充：软删除标识）
    data_status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1,
      allowNull: false,
      comment: '数据状态 1-有效 0-删除'
    },
    // 创建时间
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间',
      allowNull: false
    },
    // 更新时间
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
      allowNull: false
    }
  }, {
    // 表配置（核心修正：timestamps: false 匹配手动定义的 created_at/updated_at）
    tableName: 'user_hotel_orders',
    timestamps: false, // ✅ 关键：禁用自动时间字段，避免冲突
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { name: 'idx_user_id', fields: ['user_id'] },
      { name: 'idx_hotel_id', fields: ['hotel_id'] },
      { name: 'idx_room_id', fields: ['room_id'] }, // ✅ 新增：房间ID索引，优化关联查询
      { name: 'idx_order_status', fields: ['order_status'] }, // ✅ 修正：匹配新的order_status字段
      { name: 'idx_created_at', fields: ['created_at'] }
    ],
    comment: '用户酒店订单表'
  });

  // 关联配置（完全正确）
  UserHotelOrders.associate = (models) => {
    // 关联酒店表
    UserHotelOrders.belongsTo(models.Hotel, {
      foreignKey: 'hotel_id',
      as: 'hotel',
      targetKey: 'id'
    });

    // 关联房间表（现在模型和数据库都有 room_id 了）
    UserHotelOrders.belongsTo(models.HotelRoom, {
      foreignKey: 'room_id',
      as: 'room',
      targetKey: 'id'
    });

    // 关联用户表（注意：User模型已重命名为UserModel，需适配）
    UserHotelOrders.belongsTo(models.User || models.UserModel, {
      foreignKey: 'user_id',
      as: 'user',
      targetKey: 'id'
    });
  };

  return UserHotelOrders;
};