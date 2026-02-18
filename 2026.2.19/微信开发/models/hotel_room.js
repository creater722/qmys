module.exports = (sequelize, DataTypes) => {
  const HotelRoom = sequelize.define('HotelRoom', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '房间ID'
    },
    hotelId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'hotel_id',
      allowNull: false,
      comment: '所属酒店ID'
    },
    roomType: {
      type: DataTypes.STRING(50),
      field: 'room_type',
      comment: '房间类型：单人间/双人间'
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      comment: '房间价格'
    },
    bedCount: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'bed_count',
      comment: '床位数'
    },
    area: {
      type: DataTypes.DECIMAL(5,2),
      comment: '房间面积'
    },
    facilities: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: '房间设施'
    },
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: '房间库存'
    },
    isActive: {
      type: DataTypes.TINYINT.UNSIGNED,
      field: 'is_active',
      defaultValue: 1,
      comment: '是否启用'
    }
  }, {
    tableName: 'hotel_rooms',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['hotel_id'], comment: '按酒店查询房间' },
      { fields: ['room_type'], comment: '按房间类型查询' }
    ]
  });

  HotelRoom.associate = (models) => {
    if (models.Hotel) {
      HotelRoom.belongsTo(models.Hotel, {
        foreignKey: 'hotel_id',
        as: 'hotel',
        onDelete: 'CASCADE'
      });
    }
  };

  return HotelRoom;
};