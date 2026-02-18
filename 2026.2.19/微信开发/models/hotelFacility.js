module.exports = (sequelize, DataTypes) => {
  // 定义酒店设施模型
  const HotelFacility = sequelize.define('HotelFacility', {
    // 主键ID
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '设施ID，自增主键'
    },
    // 设施名称（如：免费WiFi、停车场）
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // 确保设施名称不重复
      comment: '设施名称'
    },
    // 设施图标URL（小程序前端展示用）
    icon: {
      type: DataTypes.STRING(255),
      defaultValue: null,
      comment: '设施图标URL'
    },
    // 排序权重（数字越大展示越靠前）
    sort: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 0,
      comment: '排序权重，0为默认'
    },
    // 启用状态（1-启用，0-禁用）
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1,
      comment: '状态：1-启用 0-禁用'
    },
    // 创建时间（自动填充）
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    // 更新时间（自动更新）
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    // 数据库表名（和建表语句一致）
    tableName: 'hotel_facilities',
    // 启用时间戳（对应createdAt/updatedAt）
    timestamps: true,
    // 下划线命名（适配数据库字段名）
    underscored: true,
    // 字符集（支持emoji等特殊字符）
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 索引配置
    indexes: [
      { fields: ['name'], comment: '设施名称唯一索引' },
      { fields: ['status'], comment: '按状态查询设施' },
      { fields: ['sort'], comment: '按排序权重查询' }
    ]
  });

  // 定义关联关系（和Hotel模型多对多）- 新增存在性校验
  HotelFacility.associate = (models) => {
    // 核心优化：先校验models和models.Hotel是否存在，避免加载顺序问题
    if (models && models.Hotel) {
      HotelFacility.belongsToMany(models.Hotel, {
        through: 'hotel_facility_relations', // 关联表名
        foreignKey: 'facility_id',           // 关联表中指向设施的外键
        otherKey: 'hotel_id',                // 关联表中指向酒店的外键
        as: 'hotels',                        // 别名（反向关联时使用）
        onDelete: 'CASCADE'                  // 级联删除，删除设施时自动删除关联关系
      });
      console.log('🔗 HotelFacility ↔ Hotel 关联配置成功');
    } else {
      console.warn('⚠️ HotelFacility关联失败：models.Hotel 未加载（后续会统一重试）');
    }
  };

  return HotelFacility;
};