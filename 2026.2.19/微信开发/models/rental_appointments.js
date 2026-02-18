module.exports = (sequelize, DataTypes) => {
  const RentalAppointment = sequelize.define('RentalAppointment', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '预约ID'
    },
    listingId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'listing_id',
      allowNull: false,
      comment: '房源ID',
      // 新增：外键关联校验（可选，建议在业务层做，模型层兜底）
      validate: {
        isInt: { msg: '房源ID必须为整数' }
      }
    },
    tenantUserId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'tenant_user_id',
      allowNull: false,
      comment: '租客用户ID',
      validate: {
        isInt: { msg: '租客ID必须为整数' }
      }
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      field: 'appointment_date',
      allowNull: false, // 新增：预约日期不能为空
      comment: '预约日期（格式：YYYY-MM-DD）',
      // 新增：日期校验（不能是过去的日期）
      validate: {
        isAfter: {
          args: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
          msg: '预约日期不能是过去的日期'
        }
      }
    },
    appointmentTime: {
      type: DataTypes.STRING(20),
      field: 'appointment_time',
      allowNull: false, // 新增：预约时间段不能为空
      comment: '预约时间段（如：14:00-16:00）'
    },
    contactName: {
      type: DataTypes.STRING(50),
      field: 'contact_name',
      allowNull: false, // 新增：联系人姓名不能为空
      comment: '联系人姓名',
      // 新增：姓名长度校验
      validate: {
        len: { args: [2, 50], msg: '联系人姓名长度需在2-50个字之间' }
      }
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      field: 'contact_phone',
      allowNull: false, // 新增：联系人电话不能为空
      comment: '联系人电话',
      // 新增：手机号格式校验
      validate: {
        is: { args: /^1[3-9]\d{9}$/, msg: '请输入正确的手机号' }
      }
    },
    status: {
      type: DataTypes.ENUM('pending','confirmed','completed','cancelled'),
      defaultValue: 'pending',
      comment: '预约状态：pending-待确认/confirmed-已确认/completed-已完成/cancelled-已取消'
    },
    viewResult: {
      type: DataTypes.ENUM('interested','not_interested','rented'),
      field: 'view_result',
      comment: '看房结果：interested-有意向/not_interested-无意向/rented-已签约',
      // 新增：默认值为空，只有完成看房后才填写
      allowNull: true
    },
    // 新增：备注字段（可选，提升业务灵活性）
    remark: {
      type: DataTypes.STRING(500),
      comment: '预约备注（如：租客要求带宠物）'
    }
  }, {
    tableName: 'rental_appointments',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 新增：禁用复数表名自动转换（双重保障）
    freezeTableName: true,
    indexes: [
      { fields: ['listing_id'], comment: '按房源查询预约' },
      { fields: ['tenant_user_id'], comment: '按租客查询预约' },
      { fields: ['appointment_date'], comment: '按日期查询预约' },
      { fields: ['status'], comment: '按状态查询预约' },
      // 新增：复合索引（高频查询组合）
      { fields: ['listing_id', 'appointment_date'], comment: '房源+日期（房东查看当日预约）' },
      { fields: ['tenant_user_id', 'status'], comment: '租客+状态（租客查看我的预约）' }
    ]
  });

  // 关联配置（优化：增加模型存在性校验，避免启动报错）
  RentalAppointment.associate = (models) => {
    // 1. 预约 → 房源（多对一）
    if (models.RentalListing) {
      RentalAppointment.belongsTo(models.RentalListing, {
        foreignKey: 'listing_id',
        as: 'listing',
        onDelete: 'CASCADE' // 房源删除，预约也删除
      });
    }

    // 2. 预约 → 租客（多对一）
    if (models.User) {
      RentalAppointment.belongsTo(models.User, {
        foreignKey: 'tenant_user_id',
        as: 'tenant',
        onDelete: 'CASCADE' // 租客账号删除，预约也删除
      });
    }

    // 新增：预约 → 房东（通过房源关联，方便查询）
    if (models.RentalListing && models.User) {
      RentalAppointment.belongsTo(models.User, {
        through: models.RentalListing,
        foreignKey: 'listing_id',
        sourceKey: 'user_id',
        as: 'landlord'
      });
    }
  };

  return RentalAppointment;
};