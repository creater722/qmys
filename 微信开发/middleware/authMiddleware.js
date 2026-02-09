/**
 * JWT登录验证中间件
 */
const jwt = require('jsonwebtoken');

// 从环境变量读取密钥（没有则用默认值）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123456';

// 登录验证中间件
const authenticate = (req, res, next) => {
  // 从请求头获取Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录，请先登录',
      data: null
    });
  }

  // 提取Token
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证Token
    const decoded = jwt.verify(token, JWT_SECRET);
    // 将用户信息挂载到req上
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Token无效或已过期',
      data: null
    });
  }
};

module.exports = {
  authenticate
};