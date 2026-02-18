/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 控制台打印错误栈
  console.error(`[${new Date().toISOString()}] ❌ ${err.stack}`);

  // 统一响应格式
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    data: null,
    // 开发环境返回错误栈
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;