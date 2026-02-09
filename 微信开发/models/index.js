'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

// 替换环境变量
const replaceEnvVars = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].startsWith('${') && obj[key].endsWith('}')) {
      const envKey = obj[key].slice(2, -1);
      obj[key] = process.env[envKey] || obj[key];
    }
    if (key === 'port') obj[key] = parseInt(obj[key], 10);
  }
  return obj;
};
const parsedConfig = replaceEnvVars({ ...config });

const db = {};
let sequelize;
if (parsedConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[parsedConfig.use_env_variable], parsedConfig);
} else {
  sequelize = new Sequelize(
    parsedConfig.database,
    parsedConfig.username,
    parsedConfig.password,
    parsedConfig
  );
}

// 1. 先加载所有模型（不执行关联）
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js' &&
      !file.includes('Routes') // 排除路由文件
    );
  });

// 2. 加载模型（捕获单个文件错误）
modelFiles.forEach(file => {
  try {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
    console.log(`✅ 模型加载成功：${file}`);
  } catch (err) {
    console.error(`❌ 模型加载失败：${file} →`, err.message);
    // 加载失败不终止，仅跳过该模型
  }
});

// 3. 执行关联（包裹try-catch，防止单个关联错误导致崩溃）
console.log('\n📌 开始建立模型关联...');
Object.keys(db).forEach(modelName => {
  try {
    if (db[modelName].associate) {
      db[modelName].associate(db);
      console.log(`✅ 关联成功：${modelName}`);
    }
  } catch (err) {
    console.error(`❌ 关联失败：${modelName} →`, err.message);
    // 关联失败不终止
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;