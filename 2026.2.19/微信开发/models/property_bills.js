// models/property_bills.js
module.exports = (sequelize, DataTypes) => {
  const PropertyBill = sequelize.define('PropertyBill', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '账单ID'
    },
    billNo: {
      type: DataTypes.STRING(50),
      field: 'bill_no',
      unique: true,
      allowNull: false,
      comment: '账单号'
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'user_id',
      allowNull: false,
      comment: '业主ID'
    },
    year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '年份'
    },
    month: {
      type: DataTypes.TINYINT.UNSIGNED,
      comment: '月份'
    },
    buildingNo: {
      type: DataTypes.STRING(20),
      field: 'building_no',
      comment: '楼号'
    },
    roomNo: {
      type: DataTypes.STRING(20),
      field: 'room_no',
      comment: '房号'
    },
    items: {
      type: DataTypes.JSON,
      comment: '费用项：[{"name":"物业费","amount":200}]'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10,2),
      field: 'total_amount',
      allowNull: false,
      comment: '应付总额'
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10,2),
      field: 'paid_amount',
      defaultValue: 0,
      comment: '已付金额'
    },
    status: {
      type: DataTypes.ENUM('unpaid','partial','paid','overdue'),
      defaultValue: 'unpaid',
      comment: '账单状态'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      field: 'due_date',
      comment: '截止日期'
    }
  }, {
    tableName: 'property_bills',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['user_id'], comment: '按业主查询' },
      { fields: ['bill_no'], comment: '按账单号查询' },
      { fields: ['status'], comment: '按状态查询' },
      { fields: ['due_date'], comment: '按截止日期查询' },
      { fields: ['year', 'month'], comment: '按年月查询' }
    ]
  });

  // 关联配置
  PropertyBill.associate = (models) => {
    // 账单 → 用户（业主）
    PropertyBill.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return PropertyBill;
};