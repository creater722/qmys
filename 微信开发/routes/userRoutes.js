// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 模拟用户数据库
const users = [
  { id: 1, phone: '13800138000', openid: 'test_openid', nickname: '测试用户' }
];

// 关键：统一密钥（和authMiddleware.js一致）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123456';

// 1. 发送验证码接口
router.post('/send-code', (req, res, next) => {
  try {
    const { phone } = req.body;
    console.log(`向手机号 ${phone} 发送验证码：123456`);
    res.status(200).json({
      code: 200,
      message: '验证码已发送',
      data: {}
    });
  } catch (err) {
    next(err);
  }
});

// 2. 微信登录接口
router.post('/wechat-login', (req, res, next) => {
  try {
    const { code, userInfo } = req.body;
    const openid = 'test_openid_' + Date.now();
    // 生成Token（使用统一密钥）
    const token = jwt.sign(
      { id: 1, openid: openid, nickname: userInfo.nickName },
      JWT_SECRET, // 统一密钥
      { expiresIn: '7d' }
    );
    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: { token: token }
    });
  } catch (err) {
    next(err);
  }
});

// 3. 手机号登录接口
router.post('/phone-login', (req, res, next) => {
  try {
    const { phone, code } = req.body;
    if (code !== '123456') {
      return res.status(200).json({
        code: 400,
        message: '验证码错误'
      });
    }
    // 生成Token（使用统一密钥）
    const token = jwt.sign(
      { id: 1, phone: phone },
      JWT_SECRET, // 统一密钥
      { expiresIn: '7d' }
    );
    res.status(200).json({
      code: 200,
      message: '登录成功',
      data: { token: token }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;