// models/property_notices.js
module.exports = (sequelize, DataTypes) => {
  const PropertyNotice = sequelize.define('PropertyNotice', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '公告ID'
    },
    publisherId: {
      type: DataTypes.BIGINT.UNSIGNED,
      field: 'publisher_id',
      comment: '发布人ID'
    },
    propertyCompany: {
      type: DataTypes.STRING(100),
      field: 'property_company',
      comment: '物业公司名称'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '内容'
    },
    type: {
      type: DataTypes.ENUM('notice','repair','fee','safety','activity'),
      defaultValue: 'notice',
      comment: '公告类型'
    },
    importance: {
      type: DataTypes.ENUM('normal','important','urgent'),
      defaultValue: 'normal',
      comment: '重要性'
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      field: 'is_top',
      defaultValue: false,
      comment: '是否置顶'
    },
    status: {
      type: DataTypes.ENUM('draft','published','revoked'),
      defaultValue: 'draft',
      comment: '状态'
    },
    viewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'view_count',
      defaultValue: 0,
      comment: '浏览次数'
    }
  }, {
    tableName: 'property_notices',
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      { fields: ['type'], comment: '按类型查询' },
      { fields: ['status'], comment: '按状态查询' },
      { fields: ['is_top'], comment: '按置顶查询' },
      //{ fields: ['publish_time'], comment: '按发布时间查询' }
    ]
  });

  return PropertyNotice;
};