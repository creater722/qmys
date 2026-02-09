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
      comment: '设施：["wifi","停车场"]'
    },
    services: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: '服务：["行李寄存","叫醒服务"]'
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
    tableName: 'hotels', // 对应你的酒店表名
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

  // 关联配置（关联酒店房间）
  Hotel.associate = (models) => {
    if (models.HotelRoom) {
      Hotel.hasMany(models.HotelRoom, {
        foreignKey: 'hotel_id',
        as: 'rooms',
        onDelete: 'CASCADE'
      });
    }

    // 关联用户收藏
    if (models.User && models.UserFavoriteLive) {
      Hotel.belongsToMany(models.User, {
        through: models.UserFavoriteLive,
        foreignKey: 'target_id',
        otherKey: 'user_id',
        scope: { fav_type: 'hotel' },
        as: 'collectUsers'
      });
    }
  };

  return Hotel;
};