module.exports = (sequelize, DataTypes) => {
  const UserFavoriteLive = sequelize.define('UserFavoriteLive', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '收藏ID'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      allowNull: false,
      comment: '用户ID',
      // 新增：数值类型校验（兜底）
      validate: {
        isInt: { msg: '用户ID必须为正整数' },
        min: { args: 1, msg: '用户ID不能小于1' }
      }
    },
    favType: {
      type: DataTypes.ENUM('hotel','rental','worker'),
      field: 'fav_type',
      allowNull: false,
      comment: '收藏类型：hotel-酒店/rental-租房/worker-维修人员',
      // 新增：枚举值合法性校验（避免传入非定义值）
      validate: {
        isIn: { 
          args: [['hotel','rental','worker']], 
          msg: '收藏类型只能是hotel/rental/worker' 
        }
      }
    },
    targetId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'target_id',
      allowNull: false,
      comment: '目标ID（对应收藏类型的主键）',
      // 新增：数值类型校验
      validate: {
        isInt: { msg: '目标ID必须为正整数' },
        min: { args: 1, msg: '目标ID不能小于1' }
      }
    },
    remark: {
      type: DataTypes.STRING(200),
      comment: '用户备注',
      // 新增：备注长度限制（避免超长内容）
      validate: {
        len: { args: [0, 200], msg: '备注长度不能超过200个字' }
      }
    },
    tags: {
      type: DataTypes.JSON,
      comment: '用户标签（如：["性价比高","近地铁"]）',
      // 新增：默认值为空数组，避免JSON字段为null
      defaultValue: [],
      // 新增：JSON格式校验（确保是数组）
      validate: {
        isArray(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('标签必须是数组格式');
          }
        }
      }
    }
  }, {
    tableName: 'user_favorites_live',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 新增：禁用复数表名自动转换（双重保障）
    freezeTableName: true,
    indexes: [
      { fields: ['user_id'], comment: '按用户查询所有收藏' },
      { fields: ['fav_type'], comment: '按收藏类型查询' },
      // 核心唯一索引：确保同一用户对同一目标只能收藏一次
      { 
        fields: ['user_id', 'fav_type', 'target_id'], 
        unique: true, 
        name: 'uk_user_fav_target', // 新增：索引命名，方便维护
        comment: '唯一收藏（用户+类型+目标ID）' 
      },
      // 新增：复合索引（用户+类型），适配“我的租房收藏/我的酒店收藏”高频查询
      { 
        fields: ['user_id', 'fav_type'], 
        comment: '按用户+收藏类型查询（如：我的租房收藏）' 
      }
    ],
    // 新增：自定义错误提示（唯一索引冲突时）
    hooks: {
      beforeCreate: async (instance, options) => {
        // 提前校验唯一索引，自定义错误信息
        const exist = await UserFavoriteLive.findOne({
          where: {
            userId: instance.userId,
            favType: instance.favType,
            targetId: instance.targetId
          }
        });
        if (exist) {
          throw new Error(`已收藏该${instance.favType === 'rental' ? '租房' : instance.favType === 'hotel' ? '酒店' : '维修人员'}`);
        }
      }
    }
  });

  // 新增：关联配置（适配多类型收藏）
  UserFavoriteLive.associate = (models) => {
    // 1. 收藏 → 用户（多对一）
    if (models.User) {
      UserFavoriteLive.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE' // 用户删除，收藏也删除
      });
    }

    // 2. 收藏 → 租房房源（多对一，仅fav_type=rental时）
    if (models.RentalListing) {
      UserFavoriteLive.belongsTo(models.RentalListing, {
        foreignKey: 'target_id',
        as: 'rentalListing',
        constraints: false, // 非强外键（兼容hotel/worker类型）
        scope: { fav_type: 'rental' },
        onDelete: 'CASCADE' // 房源删除，收藏也删除
      });
    }

    // 3. 可扩展：收藏 → 酒店/维修人员（同理）
    // if (models.Hotel) {
    //   UserFavoriteLive.belongsTo(models.Hotel, {
    //     foreignKey: 'target_id',
    //     as: 'hotel',
    //     constraints: false,
    //     scope: { fav_type: 'hotel' },
    //     onDelete: 'CASCADE'
    //   });
    // }
  };

  return UserFavoriteLive;
};