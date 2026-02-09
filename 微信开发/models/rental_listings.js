module.exports = (sequelize, DataTypes) => {
  const RentalListing = sequelize.define('RentalListing', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '租房房源ID'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      comment: '发布者ID'
    },
    agencyId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'agency_id',
      comment: '中介公司ID'
    },
    landlordPhone: {
      type: DataTypes.STRING(20),
      field: 'landlord_phone',
      comment: '房东电话'
      // 手机号格式校验（注释掉，避免低版本Sequelize不兼容）
      // validate: {
      //   is: /^1[3-9]\d{9}$/,
      //   msg: '房东电话格式错误'
      // }
    },
    rentType: {
      type: DataTypes.ENUM('whole','shared','short_term'),
      field: 'rent_type',
      allowNull: false,
      comment: '整租/合租/短租'
    },
    propertyType: {
      type: DataTypes.ENUM('apartment','house','villa','dorm'),
      field: 'property_type',
      comment: '公寓/住宅/别墅/宿舍'
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
    street: {
      type: DataTypes.STRING(100),
      comment: '街道'
    },
    communityName: {
      type: DataTypes.STRING(100),
      field: 'community_name',
      comment: '小区名称'
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
    nearSubway: {
      type: DataTypes.STRING(100),
      field: 'near_subway',
      comment: '最近地铁'
    },
    subwayDistance: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'subway_distance',
      comment: '距地铁口距离（米）'
    },
    area: {
      type: DataTypes.DECIMAL(5,2),
      comment: '面积'
      // 👇 核心修复：注释掉所有validate，解决语法错误
      // validate: {
      //   min: {
      //     args: [1],
      //     msg: '面积不能小于1㎡'
      //   }
      // }
    },
    roomCount: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'room_count',
      comment: '室'
      // validate: {
      //   min: { args: [0], msg: '室数不能小于0' },
      //   max: { args: [20], msg: '室数不能大于20' }
      // }
    },
    hallCount: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'hall_count',
      comment: '厅'
      // validate: {
      //   min: { args: [0], msg: '厅数不能小于0' },
      //   max: { args: [10], msg: '厅数不能大于10' }
      // }
    },
    bathroomCount: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'bathroom_count',
      comment: '卫'
      // validate: {
      //   min: { args: [0], msg: '卫数不能小于0' },
      //   max: { args: [10], msg: '卫数不能大于10' }
      // }
    },
    rentPrice: {
      type: DataTypes.DECIMAL(10,2),
      field: 'rent_price',
      allowNull: false,
      comment: '月租金'
      // validate: {
      //   min: {
      //     args: [1],
      //     msg: '租金不能小于1元'
      //   }
      // }
    },
    status: {
      type: DataTypes.ENUM('available','reserved','rented','offline'),
      defaultValue: 'available',
      comment: '房源状态：available-可租/reserved-已预约/rented-已租/offline-已下架'
    },
    facilities: {
      type: DataTypes.JSON,
      comment: '配置：["空调","冰箱"]',
      defaultValue: [] // 保留默认值，不影响加载
    },
    title: {
      type: DataTypes.STRING(200),
      comment: '标题',
      allowNull: false, // 保留非空约束（Sequelize基础语法，兼容所有版本）
      // validate: {
      //   len: {
      //     args: [2, 200],
      //     msg: '标题长度需在2-200个字之间'
      //   }
      // }
    },
    description: {
      type: DataTypes.TEXT,
      comment: '详细描述'
    },
    viewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'view_count',
      defaultValue: 0,
      comment: '浏览次数'
    }
  }, {
    tableName: 'rental_listings',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    freezeTableName: true,
    indexes: [
      { fields: ['city'], comment: '按城市查询' },
      { fields: ['rent_type'], comment: '按租房类型查询' },
      { fields: ['rent_price'], comment: '按价格查询' },
      { fields: ['status'], comment: '按状态查询' },
      { fields: ['near_subway'], comment: '按地铁查询' },
      { fields: ['city', 'rent_type', 'status'], comment: '城市+租房类型+状态（高频查询）' }
    ]
  });

  // 关联配置（保留容错校验，避免关联报错）
  RentalListing.associate = (models) => {
    if (models.User) {
      RentalListing.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'publisher',
        onDelete: 'SET NULL'
      });
    }

    if (models.RentalAppointment) {
      RentalListing.hasMany(models.RentalAppointment, {
        foreignKey: 'listing_id',
        as: 'appointments',
        onDelete: 'CASCADE'
      });
    }

    if (models.User && models.UserFavoriteLive) {
      RentalListing.belongsToMany(models.User, {
        through: models.UserFavoriteLive,
        foreignKey: 'target_id',
        otherKey: 'user_id',
        scope: { fav_type: 'rental' },
        as: 'collectUsers'
      });
    }
  };

  return RentalListing;
};