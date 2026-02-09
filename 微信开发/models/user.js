// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户主键ID'
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      comment: '手机号'
    },
    nickname: {
      type: DataTypes.STRING(50),
      comment: '用户昵称'
    },
    status: {
      type: DataTypes.TINYINT.UNSIGNED,
      defaultValue: 1,
      comment: '1-正常 0-禁用'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['phone'], comment: '按手机号查询' },
      { fields: ['status'], comment: '按状态查询' }
    ]
  });

  // 关联配置
  User.associate = (models) => {
    // 用户 → 维修工单（一对多）
    User.hasMany(models.RepairRequest, {
      foreignKey: 'user_id',
      as: 'repairRequests',
      onDelete: 'CASCADE'
    });

    // 用户 → 租房预约（一对多）
    User.hasMany(models.RentalAppointment, {
      foreignKey: 'tenant_user_id',
      as: 'rentalAppointments',
      onDelete: 'CASCADE'
    });

    // 用户 → 物业费账单（一对多）
    User.hasMany(models.PropertyBill, {
      foreignKey: 'user_id',
      as: 'propertyBills',
      onDelete: 'CASCADE'
    });

    // 用户 ←→ 酒店（收藏）
    User.belongsToMany(models.Hotel, {
      through: models.UserFavoriteLive,
      foreignKey: 'user_id',
      otherKey: 'target_id',
      scope: { fav_type: 'hotel' },
      as: 'collectedHotels'
    });

    // 用户 ←→ 租房房源（收藏）
    User.belongsToMany(models.RentalListing, {
      through: models.UserFavoriteLive,
      foreignKey: 'user_id',
      otherKey: 'target_id',
      scope: { fav_type: 'rental' },
      as: 'collectedRentals'
    });

    // 用户 ←→ 维修师傅（收藏）
    User.belongsToMany(models.RepairWorker, {
      through: models.UserFavoriteLive,
      foreignKey: 'user_id',
      otherKey: 'target_id',
      scope: { fav_type: 'worker' },
      as: 'collectedWorkers'
    });
  };

  return User;
};