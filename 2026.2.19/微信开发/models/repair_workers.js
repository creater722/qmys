// models/repair_workers.js
module.exports = (sequelize, DataTypes) => {
  const RepairWorker = sequelize.define('RepairWorker', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '师傅ID'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      comment: '关联用户ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '电话'
    },
    idNumber: {
      type: DataTypes.STRING(18),
      field: 'id_number',
      comment: '身份证号'
    },
    skills: {
      type: DataTypes.JSON,
      comment: '技能：["水电","空调"]'
    },
    workAreas: {
      type: DataTypes.JSON,
      field: 'work_areas',
      comment: '工作区域'
    },
    isCertified: {
      type: DataTypes.BOOLEAN,
      field: 'is_certified',
      defaultValue: false,
      comment: '是否认证'
    },
    status: {
      type: DataTypes.ENUM('available','busy','offline'),
      defaultValue: 'offline',
      comment: '状态'
    },
    rating: {
      type: DataTypes.DECIMAL(2,1),
      comment: '评分'
    },
    completedOrders: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'completed_orders',
      defaultValue: 0,
      comment: '已完成订单数'
    }
  }, {
    tableName: 'repair_workers',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['user_id'], comment: '按用户查询' },
      { fields: ['status'], comment: '按状态查询' },
      { fields: ['phone'], comment: '按电话查询' }
    ]
  });

  // 关联配置
  RepairWorker.associate = (models) => {
    // 师傅 → 维修工单（一对多）
    RepairWorker.hasMany(models.RepairRequest, {
      foreignKey: 'worker_id',
      as: 'repairRequests',
      onDelete: 'SET NULL'
    });

    // 师傅 ←→ 用户（收藏）
    RepairWorker.belongsToMany(models.User, {
      through: models.UserFavoriteLive,
      foreignKey: 'target_id',
      otherKey: 'user_id',
      scope: { fav_type: 'worker' },
      as: 'collectUsers'
    });
  };

  return RepairWorker;
};