module.exports = (sequelize, DataTypes) => {
  // 定义酒店服务模型
  const HotelService = sequelize.define('HotelService', {
    // 主键ID
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '服务ID，自增主键'
    },
    // 服务名称（如：行李寄存、叫醒服务）
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // 确保服务名称不重复
      comment: '服务名称'
    },
    // 服务描述（补充说明）
    description: {
      type: DataTypes.STRING(255),
      defaultValue: null,
      comment: '服务描述'
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
    tableName: 'hotel_services',
    // 启用时间戳（对应createdAt/updatedAt）
    timestamps: true,
    // 下划线命名（适配数据库字段名）
    underscored: true,
    // 字符集（支持emoji等特殊字符）
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 索引配置（提升查询效率）
    indexes: [
      { fields: ['name'], comment: '服务名称唯一索引' },
      { fields: ['status'], comment: '按状态查询服务' },
      { fields: ['sort'], comment: '按排序权重查询' }
    ]
  });

  // 定义关联关系（和Hotel模型多对多）- 增加存在性校验
  HotelService.associate = (models) => {
    // 核心：先校验models和models.Hotel是否存在，避免加载顺序问题
    if (models && models.Hotel) {
      HotelService.belongsToMany(models.Hotel, {
        through: 'hotel_service_relations', // 关联表名
        foreignKey: 'service_id',           // 关联表中指向服务的外键
        otherKey: 'hotel_id',                // 关联表中指向酒店的外键
        as: 'hotels',                        // 别名（反向关联时使用）
        onDelete: 'CASCADE'                  // 级联删除，删除服务时自动删除关联关系
      });
    } else {
      console.warn('⚠️ HotelService关联失败：models.Hotel 未加载（后续会统一重试）');
    }
  };

  return HotelService;
};