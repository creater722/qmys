// models/repair_orders.js
module.exports = (sequelize, DataTypes) => {
    const RepairOrder = sequelize.define('RepairOrder', {
        // 保留你的原有字段（不变）
        user_id: { type: DataTypes.INTEGER, allowNull: false, comment: '报修用户ID' },
        worker_id: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null, comment: '维修师傅ID' },
        order_no: { type: DataTypes.STRING(50), unique: true, allowNull: false, comment: '工单号' },
        repair_type: { type: DataTypes.STRING(50), allowNull: false, comment: '故障类型' },
        sub_type: { type: DataTypes.STRING(50), allowNull: true, comment: '子类型' },
        urgency: { type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'), defaultValue: 'normal', comment: '紧急程度' },
        title: { type: DataTypes.STRING(200), allowNull: true, comment: '问题标题' },
        description: { type: DataTypes.TEXT, allowNull: false, comment: '详细描述' },
        address: { type: DataTypes.STRING(500), allowNull: false, comment: '维修地址' },
        longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: '经度' },
        latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, comment: '纬度' },
        contact_name: { type: DataTypes.STRING(50), allowNull: true, comment: '联系人姓名' },
        contact_phone: { type: DataTypes.STRING(20), allowNull: false, comment: '联系人电话' },
        best_time: { type: DataTypes.STRING(100), allowNull: true, comment: '方便上门时间' },
        images: { type: DataTypes.JSON, allowNull: true, comment: '问题图片数组' },
        video_url: { type: DataTypes.STRING(500), allowNull: true, comment: '视频说明链接' },
        estimated_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: '预估费用' },
        final_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: '最终费用' },
        status: { type: DataTypes.ENUM('pending', 'assigned', 'accepted', 'processing', 'completed', 'cancelled'), defaultValue: 'pending', comment: '状态' },
        worker_name: { type: DataTypes.STRING(50), allowNull: true, comment: '师傅姓名' },
        worker_phone: { type: DataTypes.STRING(20), allowNull: true, comment: '师傅电话' },
        worker_arrived_at: { type: DataTypes.DATE, allowNull: true, comment: '师傅到达时间' },
        submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, comment: '提交时间' },
        assigned_at: { type: DataTypes.DATE, allowNull: true, comment: '分配时间' },
        started_at: { type: DataTypes.DATE, allowNull: true, comment: '开始维修时间' },
        completed_at: { type: DataTypes.DATE, allowNull: true, comment: '完成时间' },
        user_rating: { type: DataTypes.TINYINT, allowNull: true, comment: '用户评分 1-5' },
        user_comment: { type: DataTypes.TEXT, allowNull: true, comment: '用户评价' },
        worker_rating: { type: DataTypes.TINYINT, allowNull: true, comment: '师傅对用户评分' },
        cancel_reason: { type: DataTypes.STRING(200), allowNull: true, comment: '取消原因' },
        remark: { type: DataTypes.TEXT, allowNull: true, comment: '备注' }
    }, {
        tableName: 'repair_orders',
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ['order_no'], unique: true },
            { fields: ['user_id'] },
            { fields: ['worker_id'] },
            { fields: ['status'] },
            { fields: ['repair_type'] },
            { fields: ['submitted_at'] }
        ],
        comment: '维修工单表'
    });

    // 修复关联逻辑（安全检查）
    RepairOrder.associate = (models) => {
        // 关联User（确保User模型存在）
        if (models.User) {
            RepairOrder.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user',
                onDelete: 'CASCADE'
            });
        } else {
            console.warn('⚠️ User模型不存在，跳过RepairOrder-User关联');
        }

        // 关联RepairWorker（确保模型存在）
        if (models.RepairWorker) {
            RepairOrder.belongsTo(models.RepairWorker, {
                foreignKey: 'worker_id',
                as: 'worker',
                onDelete: 'SET NULL'
            });
        } else {
            console.warn('⚠️ RepairWorker模型不存在，跳过RepairOrder-RepairWorker关联');
        }
    };

    // 修复工单号生成钩子（避免错误）
    RepairOrder.beforeCreate(async (order, options) => {
        try {
            if (!order.order_no) {
                const date = new Date();
                const prefix = 'RP';
                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                const random = Math.floor(1000 + Math.random() * 9000);
                order.order_no = `${prefix}${dateStr}${random}`;
            }
        } catch (err) {
            console.error('⚠️ 生成工单号失败：', err.message);
            // 兜底生成工单号
            order.order_no = `RP${Date.now()}`;
        }
    });

    return RepairOrder;
};