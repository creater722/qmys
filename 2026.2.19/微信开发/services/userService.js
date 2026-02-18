// services/userService.js
const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * 根据手机号查找或创建用户（登录核心逻辑）
 * @param {string} phone - 用户手机号
 * @returns {Promise<Object>} 用户信息
 */
async function findOrCreateUserByPhone(phone) {
  try {
    // 查找用户，不存在则创建
    const [user, created] = await User.findOrCreate({
      where: { phone }, // 按手机号唯一索引查找
      defaults: {
        phone,
        nickname: `用户${phone.slice(-4)}`, // 生成默认昵称（如用户1234）
        status: 1 // 默认为正常状态
      }
    });

    console.log(`用户处理结果：${created ? '新增用户' : '查询已有用户'}，userId：${user.id}`);
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      status: user.status,
      isNew: created // 是否是新用户
    };
  } catch (error) {
    console.error('查找/创建用户失败：', error);
    throw new Error(`用户操作失败：${error.message}`);
  }
}

/**
 * 根据userId查询用户信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户信息
 */
async function getUserById(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'phone', 'nickname', 'status', 'created_at']
  });
  if (!user) {
    throw new Error('用户不存在');
  }
  return user;
}

module.exports = {
  findOrCreateUserByPhone,
  getUserById
};