/**
 * 用户酒店收藏表模型
 * 关联：用户-酒店 多对多（收藏关系）
 */
// ✅ 确保使用普通函数导出，而非箭头函数
module.exports = function(sequelize, DataTypes) {
  // 防御性检查：确保 sequelize 和 DataTypes 存在
  if (!sequelize || !DataTypes) {
    throw new Error('Sequelize 或 DataTypes 未传入模型');
  }

  // 定义模型
  const UserHotelCollections = sequelize.define('UserHotelCollections', {
    // 主键ID
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '收藏记录ID'
    },
    // 用户ID
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'users', // 关联用户表
        key: 'id'
      },
      onDelete: 'CASCADE', // 用户删除时，收藏记录也删除
      onUpdate: 'CASCADE'
    },
    // 酒店ID
    hotel_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: '酒店ID',
      references: {
        model: 'hotels', // 关联酒店表
        key: 'id'
      },
      onDelete: 'CASCADE', // 酒店删除时，收藏记录也删除
      onUpdate: 'CASCADE'
    },
    // 收藏时间
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '收藏时间',
      allowNull: false
    },
    // 更新时间（预留）
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '更新时间',
      allowNull: false
    }
  }, {
    // 表配置
    tableName: 'user_hotel_collections', // 数据库表名
    timestamps: false, // 禁用Sequelize自动生成的createdAt/updatedAt
    charset: 'utf8mb4', // 字符集（支持emoji）
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      // 联合唯一索引：一个用户只能收藏一次同一个酒店
      {
        name: 'uk_user_hotel',
        unique: true,
        fields: ['user_id', 'hotel_id']
      },
      // 普通索引：加速按用户查询收藏
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      // 普通索引：加速按酒店查询收藏
      {
        name: 'idx_hotel_id',
        fields: ['hotel_id']
      }
    ],
    comment: '用户酒店收藏表'
  });

  // ✅ 核心修复：使用普通函数定义associate，避免箭头函数丢失this
  UserHotelCollections.associate = function(models) {
    // 防御性检查：确保 models 存在
    if (!models) return;
    
    // 关联酒店表（多对一）
    if (models.Hotel) {
      UserHotelCollections.belongsTo(models.Hotel, {
        foreignKey: 'hotel_id', // 外键字段
        as: 'hotel', // 别名（前端查询时用）
        targetKey: 'id' // 关联的目标字段
      });
    }

    // 关联用户表（多对一）
    if (models.UserModel || models.User) {
      UserHotelCollections.belongsTo(models.User || models.UserModel, {
        foreignKey: 'user_id',
        as: 'user',
        targetKey: 'id'
      });
    }
  };

  return UserHotelCollections;
};