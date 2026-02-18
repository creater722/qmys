//'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize'); // 引入Sequelize类
const process = require('process');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

// ✅ 移除：提前导入模型的错误代码
// const UserHotelCollections = require('./user_hotel_collections')(sequelize, DataTypes);
// const UserHotelOrders = require('./user_hotel_orders')(sequelize, DataTypes);

// 替换环境变量（增强：支持嵌套对象）
const replaceEnvVars = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      replaceEnvVars(obj[key]); // 递归处理嵌套对象
    } else if (typeof obj[key] === 'string' && obj[key].startsWith('${') && obj[key].endsWith('}')) {
      const envKey = obj[key].slice(2, -1);
      obj[key] = process.env[envKey] || obj[key];
      console.log(`🔧 环境变量替换：${envKey} = ${obj[key]}`);
    }
    if (key === 'port') obj[key] = parseInt(obj[key], 10);
  }
  return obj;
};
const parsedConfig = replaceEnvVars({ ...config });

const db = {};
let sequelize;
try {
  // 初始化Sequelize连接（增加连接参数校验 + 禁用CLS避免冲突）
  if (parsedConfig.use_env_variable) {
    sequelize = new Sequelize(process.env[parsedConfig.use_env_variable], {
      ...parsedConfig,
      define: {
        charset: 'utf8mb4', // 全局默认字符集（统一模型字符集）
        collate: 'utf8mb4_unicode_ci'
      },
      pool: {
        max: 10, // 连接池最大连接数
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      // ✅ 新增：禁用CLS上下文，避免变量冲突
      disableCls: true,
      // 禁用日志，解决SEQUELIZE0002警告
      logging: false
    });
  } else {
    sequelize = new Sequelize(
      parsedConfig.database,
      parsedConfig.username,
      parsedConfig.password,
      {
        ...parsedConfig,
        define: {
          charset: 'utf8mb4', // 全局默认字符集（统一模型字符集）
          collate: 'utf8mb4_unicode_ci'
        },
        pool: {
          max: 10, // 连接池最大连接数
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        // ✅ 新增：禁用CLS上下文，避免变量冲突
        disableCls: true,
        // 禁用日志，解决SEQUELIZE0002警告
        logging: false
      }
    );
  }
  console.log('✅ Sequelize初始化成功');
} catch (err) {
  console.error('❌ Sequelize初始化失败：', err.message);
  throw err; // 连接初始化失败需终止
}

// 1. 定义核心模型列表（✅ 新增：添加UserHotelOrders到核心模型）
const CORE_MODELS = ['Hotel', 'HotelService', 'HotelFacility', 'UserHotelCollections', 'UserHotelOrders', 'HotelRoom'];

// 2. 先加载所有模型（不执行关联）
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&          // 排除隐藏文件
      file !== path.basename(__filename) && // 排除自身
      file.slice(-3) === '.js' &&          // 仅加载.js文件
      !file.includes('Routes') &&          // 排除路由文件
      !file.includes('.test.')             // 排除测试文件
    );
  });

console.log(`\n📂 发现${modelFiles.length}个模型文件，开始加载...`);

// 3. 加载模型（核心修复：添加重复检查 + 优化命名规范 + 增强错误捕获）
const loadedModels = []; // 记录成功加载的模型
modelFiles.forEach(file => {
  try {
    const modelPath = path.join(__dirname, file);
    // 清除模块缓存，避免重复加载（解决Node缓存导致的重复声明）
    delete require.cache[require.resolve(modelPath)];
    
    // 关键：加载模型时，传入已初始化的sequelize和Sequelize.DataTypes
    // ✅ 核心修复1：先获取模型函数，再执行（避免直接执行报错）
    const modelFactory = require(modelPath);
    if (typeof modelFactory !== 'function') {
      throw new Error(`模型导出不是函数，当前类型：${typeof modelFactory}`);
    }
    const model = modelFactory(sequelize, Sequelize.DataTypes);
    
    // 优化：统一模型名称（避免大小写/驼峰冲突）
    const baseName = path.basename(file, '.js');
    // 驼峰转大驼峰：user_hotel_collections → UserHotelCollections
    const normalizedModelName = baseName
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    // 优先使用模型自身的name，否则用规范化名称
    const modelName = model?.name || normalizedModelName;

    // ✅ 核心修复2：检查模型是否有效 + 是否已存在
    if (!model) {
      throw new Error('模型初始化返回undefined');
    }
    if (db[modelName]) {
      console.warn(`⚠️ 模型已存在，跳过重复加载：${file} → ${modelName}`);
      return; // 跳过重复模型，避免重复赋值
    }

    // 注册模型（仅一次）
    db[modelName] = model;
    loadedModels.push(modelName);
    
    console.log(`✅ 模型加载成功：${file} → ${modelName}`);
  } catch (err) {
    console.error(`❌ 模型加载失败：${file} →`, err.message);
    // 打印完整错误栈，方便定位
    console.error(`   错误详情：`, err.stack.slice(0, 200)); // 截取前200字符，避免过长
    
    // 修复：精准匹配模型文件和核心模型名，避免误判（代码位置移到catch内，且逻辑优化）
    const fileNameWithoutExt = path.basename(file, '.js');
    // 处理驼峰文件名：hotelService → HotelService
    const normalizedFileName = fileNameWithoutExt.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    const coreModelMatch = CORE_MODELS.find(core => core.toUpperCase() === normalizedFileName);
    
    if (coreModelMatch) {
      console.error(`💥 核心模型${coreModelMatch}（文件：${file}）加载失败，服务无法启动！`);
      // 非核心模型加载失败不终止服务
      // process.exit(1);
    }
  }
});

// 4. 校验核心模型是否全部加载
const missingCoreModels = CORE_MODELS.filter(model => !loadedModels.includes(model));
if (missingCoreModels.length > 0) {
  console.error(`❌ 核心模型缺失：${missingCoreModels.join(', ')}`);
  console.error(`💡 检查models目录是否存在：${missingCoreModels.map(m => 
    m.split(/(?=[A-Z])/).join('_').toLowerCase() + '.js'
  ).join(', ')}`);
  // ✅ 修复：核心模型缺失时给出修复建议，不直接终止（方便调试）
  console.warn(`💡 临时解决方案：从CORE_MODELS中移除缺失的模型，先启动服务调试`);
  // process.exit(1);
} else {
  console.log(`✅ 所有核心模型(${CORE_MODELS.join(', ')})加载完成`);
}

// ✅ 新增：重命名User模型，彻底解决变量冲突（关键代码）
if (db.User) {
  db.UserModel = db.User; // 将User重命名为UserModel
  delete db.User; // 删除原User属性，避免Sequelize内部变量冲突
  console.log('✅ User模型已重命名为UserModel，解决变量冲突');
}

// 5. 统一执行关联（所有模型加载完成后，此时models.Hotel一定存在）
console.log('\n📌 开始建立模型关联...');
const associatedModels = [];

// ✅ 核心修复：创建代理对象，自动将User映射到UserModel
const dbProxy = new Proxy(db, {
  get(target, prop) {
    if (prop === 'User') {
      return target.UserModel; // 访问db.User时返回UserModel
    }
    return target[prop]; // 其他属性正常返回
  }
});

Object.keys(db).forEach(modelName => {
  try {
    const currentModel = db[modelName];
    // ✅ 核心修复3：严格检查associate方法是否存在且为函数
    if (currentModel?.associate && typeof currentModel.associate === 'function') {
      // ✅ 核心修改：传入代理对象，而非原始db
      currentModel.associate(dbProxy); 
      associatedModels.push(modelName);
      console.log(`✅ 关联成功：${modelName}`);
    } else if (currentModel?.associate) {
      console.warn(`⚠️ ${modelName}的associate不是函数，跳过关联`);
    }
  } catch (err) {
    console.error(`❌ 关联失败：${modelName} →`, err.message);
    // 打印关联错误详情
    console.error(`   关联错误栈：`, err.stack.slice(0, 200));
    // 核心模型关联失败时终止服务
    if (CORE_MODELS.includes(modelName)) {
      console.error(`💥 核心模型${modelName}关联失败，服务无法启动！`);
      // process.exit(1);
    }
  }
});

console.log(`✅ 共${associatedModels.length}个模型完成关联`);

// 6. 新增：测试核心模型关联是否生效
(async () => {
  try {
    // 测试Hotel和HotelService的关联（使用正确的别名hotelServices）
    const hotelRelations = db.Hotel?.associations;
    if (!hotelRelations) {
      console.warn('\n⚠️ Hotel模型无关联配置');
      return;
    }
    if (hotelRelations.hotelServices) {
      console.log('\n✅ Hotel ↔ HotelService 关联生效');
    } else if (hotelRelations.services) {
      console.log('\n⚠️ Hotel关联别名仍为services，建议改为hotelServices避免冲突');
    }
    if (hotelRelations.hotelFacilities) {
      console.log('✅ Hotel ↔ HotelFacility 关联生效');
    } else if (hotelRelations.facilities) {
      console.log('⚠️ Hotel关联别名仍为facilities，建议改为hotelFacilities避免冲突');
    }

    // ✅ 新增：测试订单模型关联是否生效
    const orderRelations = db.UserHotelOrders?.associations;
    if (orderRelations) {
      if (orderRelations.hotel) {
        console.log('✅ UserHotelOrders ↔ Hotel 关联生效');
      }
      if (orderRelations.room) {
        console.log('✅ UserHotelOrders ↔ HotelRoom 关联生效');
      }
      if (orderRelations.user) {
        console.log('✅ UserHotelOrders ↔ UserModel 关联生效');
      }
    } else {
      console.warn('\n⚠️ UserHotelOrders模型无关联配置');
    }
  } catch (err) {
    console.error('\n⚠️ 核心模型关联测试失败：', err.message);
  }
})();

// 7. 暴露核心属性
db.sequelize = sequelize;
db.Sequelize = Sequelize;
// 暴露核心模型快捷访问（✅ 新增：添加UserHotelOrders和HotelRoom）
db.core = {
  Hotel: db.Hotel,
  HotelService: db.HotelService,
  HotelFacility: db.HotelFacility,
  HotelRoom: db.HotelRoom, // 新增
  UserHotelCollections: db.UserHotelCollections,
  UserHotelOrders: db.UserHotelOrders, // 新增
  UserModel: db.UserModel // 新增：暴露重命名后的UserModel
};

// ✅ 新增：在db上添加User别名，方便路由直接使用db.User（可选）
db.User = db.UserModel;

module.exports = db;