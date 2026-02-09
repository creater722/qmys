// middleware/validateRequest.js
const { body, query, validationResult } = require('express-validator');

const rules = {
  // 分页参数校验
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须是1-100的整数')
  ],
  // 用户ID校验
  userId: [
    query('userId').isInt({ min: 1 }).withMessage('用户ID必须是大于0的整数')
  ],
  // 维修工单参数校验（已优化）
  repairOrder: [
    // 移除userId校验（从Token获取，无需前端传）
    body('repairType').notEmpty().withMessage('故障类型不能为空'),
    body('description').notEmpty().withMessage('问题描述不能为空'),
    body('address').notEmpty().withMessage('维修地址不能为空'),
    // contactPhone改为可选，仅填写时校验格式
    body('contactPhone').optional().isMobilePhone('zh-CN').withMessage('联系电话格式错误')
  ]
};

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    // 优化错误提示：显示具体字段的错误
    return res.status(400).json({
      code: 400,
      message: '参数校验失败：' + errors.array().map(err => err.msg).join('；'),
      data: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

module.exports = { validateRequest, rules };