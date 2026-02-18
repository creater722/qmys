module.exports = (sequelize, DataTypes) => {
  const Hotel = sequelize.define('Hotel', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '酒店ID'
    },
    source: {
      type: DataTypes.STRING(20),
      comment: '数据来源：self/第三方平台'
    },
    sourceId: {
      type: DataTypes.STRING(100),
      field: 'source_id',
      comment: '来源平台ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '酒店名称'
    },
    brand: {
      type: DataTypes.STRING(100),
      comment: '酒店品牌'
    },
    starRating: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'star_rating',
      validate: { min: 1, max: 5 },
      comment: '星级：1-5'
    },
    type: {
      type: DataTypes.STRING(50),
      comment: '酒店类型：商务/经济/豪华'
    },
    province: {
      type: DataTypes.STRING(50),
      comment: '省份'
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '城市'
    },
    district: {
      type: DataTypes.STRING(50),
      comment: '行政区'
    },
    address: {
      type: DataTypes.STRING(500),
      comment: '详细地址'
    },
    longitude: {
      type: DataTypes.DECIMAL(10,7),
      comment: '经度'
    },
    latitude: {
      type: DataTypes.DECIMAL(10,7),
      comment: '纬度'
    },
    phone: {
      type: DataTypes.STRING(50),
      comment: '酒店电话'
    },
    facilities: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: '设施：["wifi","停车场"]（旧字段，过渡用）'
    },
    services: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: '服务：["行李寄存","叫醒服务"]（旧字段，过渡用）'
    },
    minPrice: {
      type: DataTypes.DECIMAL(10,2),
      field: 'min_price',
      comment: '最低价格'
    },
    maxPrice: {
      type: DataTypes.DECIMAL(10,2),
      field: 'max_price',
      comment: '最高价格'
    },
    rating: {
      type: DataTypes.DECIMAL(2,1),
      validate: { min: 0, max: 5 },
      comment: '综合评价'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      field: 'cover_image',
      comment: '封面图片'
    },
    isActive: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'is_active',
      defaultValue: 1,
      comment: '是否启用：1-启用 0-禁用'
    },
    viewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'view_count',
      defaultValue: 0,
      comment: '浏览次数'
    }
  }, {
    tableName: 'hotels',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['city'], comment: '按城市查询' },
      { fields: ['star_rating'], comment: '按星级查询' },
      { fields: ['min_price', 'max_price'], comment: '按价格区间查询' },
      { fields: ['is_active'], comment: '按启用状态查询' }
    ]
  });

  // 完整的关联配置（保留原有+新增设施/服务关联）
  Hotel.associate = (models) => {
    // 1. 关联酒店房间（原有，保留）
    if (models.HotelRoom) {
      Hotel.hasMany(models.HotelRoom, {
        foreignKey: 'hotel_id',
        as: 'rooms',
        onDelete: 'CASCADE'
      });
      console.log('🔗 Hotel ↔ HotelRoom 关联配置成功');
    } else {
      console.warn('⚠️ Hotel关联HotelRoom失败：models.HotelRoom 未加载');
    }

    // 2. 关联用户收藏（原有，保留，注意表名是否正确）
    if (models.User && models.UserFavorite) {
      Hotel.belongsToMany(models.User, {
        through: models.UserFavorite,
        foreignKey: 'hotel_id',
        otherKey: 'user_id',
        as: 'collectUsers'
      });
      console.log('🔗 Hotel ↔ User（收藏）关联配置成功');
    } else {
      console.warn('⚠️ Hotel关联User收藏失败：models.User/UserFavorite 未加载');
    }

    // 3. 新增：关联酒店服务（核心修改）
    if (models.HotelService) {
      Hotel.belongsToMany(models.HotelService, {
        through: 'hotel_service_relations', // 关联表名（无需定义模型，Sequelize自动识别）
        foreignKey: 'hotel_id',             // 关联表中指向酒店的外键
        otherKey: 'service_id',             // 关联表中指向服务的外键
        as: 'hotelServices',                // 别名（避免和原有services字段冲突！）
        onDelete: 'CASCADE'                 // 级联删除，删除酒店时自动删除关联关系
      });
      console.log('🔗 Hotel ↔ HotelService 关联配置成功（别名：hotelServices）');
    } else {
      console.warn('⚠️ Hotel关联HotelService失败：models.HotelService 未加载（后续会统一重试）');
    }

    // 4. 新增：关联酒店设施（核心修改）
    if (models.HotelFacility) {
      Hotel.belongsToMany(models.HotelFacility, {
        through: 'hotel_facility_relations',
        foreignKey: 'hotel_id',
        otherKey: 'facility_id',
        as: 'hotelFacilities', // 别名（避免和原有facilities字段冲突！）
        onDelete: 'CASCADE'
      });
      console.log('🔗 Hotel ↔ HotelFacility 关联配置成功（别名：hotelFacilities）');
    } else {
      console.warn('⚠️ Hotel关联HotelFacility失败：models.HotelFacility 未加载（后续会统一重试）');
    }
  };

  return Hotel;
};