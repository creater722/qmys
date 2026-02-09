'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 插入物业公告测试数据
    await queryInterface.bulkInsert('property_notices', [
      {
        title: '2026年物业费缴纳通知',
        content: '各位业主您好：2026年物业费缴纳工作已开始，请于2026年3月1日前完成缴纳，感谢配合！',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: '小区电梯维护通知',
        content: '因电梯维护需要，2026年2月10日-2月12日小区1号楼电梯暂停使用，给您带来不便敬请谅解！',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // 回滚操作
    await queryInterface.bulkDelete('property_notices', null, {});
  }
};