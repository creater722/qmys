// models/repair_requests.js
module.exports = (sequelize, DataTypes) => {
  const RepairRequest = sequelize.define('RepairRequest', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '工单ID'
    },
    requestNo: {
      type: DataTypes.STRING(50),
      field: 'request_no',
      unique: true,
      allowNull: false,
      comment: '工单号'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      allowNull: false,
      comment: '报修人ID'
    },
    repairType: {
      type: DataTypes.STRING(50),
      field: 'repair_type',
      allowNull: false,
      comment: '维修类型'
    },
    subType: {
      type: DataTypes.STRING(50),
      field: 'sub_type',
      comment: '子类型'
    },
    urgency: {
      type: DataTypes.ENUM('low','normal','high','urgent'),
      defaultValue: 'normal',
      comment: '紧急程度'
    },
    title: {
      type: DataTypes.STRING(200),
      comment: '问题标题'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '详细描述'
    },
    address: {
      type: DataTypes.STRING(500),
      comment: '维修地址'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      field: 'contact_phone',
      comment: '联系电话'
    },
    status: {
      type: DataTypes.ENUM('submitted','assigned','accepted','processing','completed','cancelled'),
      defaultValue: 'submitted',
      comment: '工单状态'
    },
    workerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'worker_id',
      comment: '维修师傅ID'
    },
    estimatedCost: {
      type: DataTypes.DECIMAL(10,2),
      field: 'estimated_cost',
      comment: '预估费用'
    },
    finalCost: {
      type: DataTypes.DECIMAL(10,2),
      field: 'final_cost',
      comment: '最终费用'
    },
    submittedAt: {
      type: DataTypes.DATE,
      field: 'submitted_at',
      defaultValue: DataTypes.NOW,
      comment: '提交时间'
    }
  }, {
    tableName: 'repair_requests',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['user_id'], comment: '按用户查询' },
      { fields: ['request_no'], comment: '按工单号查询' },
      { fields: ['status'], comment: '按状态查询' },
      { fields: ['worker_id'], comment: '按师傅查询' },
      { fields: ['repair_type'], comment: '按类型查询' }
    ]
  });

  // 关联配置
  RepairRequest.associate = (models) => {
    // 工单 → 用户（报修人）
    RepairRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    // 工单 → 维修师傅
    RepairRequest.belongsTo(models.RepairWorker, {
      foreignKey: 'worker_id',
      as: 'worker',
      onDelete: 'SET NULL'
    });
  };

  return RepairRequest;
};