// models/user_browsing_history_live.js
module.exports = (sequelize, DataTypes) => {
  const UserBrowsingHistoryLive = sequelize.define('UserBrowsingHistoryLive', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '浏览记录ID'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      allowNull: false,
      comment: '用户ID'
    },
    viewType: {
      type: DataTypes.ENUM('hotel','rental','notice'),
      field: 'view_type',
      allowNull: false,
      comment: '浏览类型'
    },
    targetId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'target_id',
      allowNull: false,
      comment: '目标ID'
    },
    userLongitude: {
      type: DataTypes.DECIMAL(10,7),
      field: 'user_longitude',
      comment: '用户经度'
    },
    userLatitude: {
      type: DataTypes.DECIMAL(10,7),
      field: 'user_latitude',
      comment: '用户纬度'
    },
    staySeconds: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'stay_seconds',
      comment: '停留秒数'
    },
    viewedAt: {
      type: DataTypes.DATE,
      field: 'viewed_at',
      defaultValue: DataTypes.NOW,
      comment: '浏览时间'
    }
  }, {
    tableName: 'user_browsing_history_live',
    underscored: true,
    timestamps: false, // 用viewedAt替代默认时间戳
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['user_id'], comment: '按用户查询' },
      { fields: ['view_type'], comment: '按浏览类型查询' },
      { fields: ['viewed_at'], comment: '按浏览时间查询' },
      { fields: ['user_latitude', 'user_longitude'], comment: '按位置查询' }
    ]
  });

  return UserBrowsingHistoryLive;
};