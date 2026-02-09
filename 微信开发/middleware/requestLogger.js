/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // 响应完成后打印日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ✅ ${method} ${originalUrl} | ${res.statusCode} | ${duration}ms | IP: ${ip}`);
  });

  next();
};

module.exports = requestLogger;