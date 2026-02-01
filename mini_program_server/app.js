// 1. 引入所有必需的依赖包
require('dotenv').config(); // 读取 .env 配置文件
const express = require('express'); // 搭建 Web 服务
const mysql = require('mysql2'); // 连接 MySQL 数据库
const cors = require('cors'); // 解决跨域问题
const axios = require('axios'); // 调用微信官方接口

// 2. 初始化 Express 实例，设置端口
const app = express();
const port = 3000; // 本地服务端口，固定 3000，小程序端对应这个端口

// 3. 配置中间件（必须，否则无法正常接收和处理请求）
app.use(cors()); // 允许所有跨域请求（本地开发阶段无需限制）
app.use(express.json()); // 支持解析 JSON 格式的请求体
app.use(express.urlencoded({ extended: true })); // 支持解析表单格式的请求体

// 4. 创建 MySQL 连接池（读取 .env 中的 MySQL 配置，自动连接本地 qmys 数据库）
const dbPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10, // 连接池最大连接数，避免连接过多
  charset: 'utf8mb4' // 支持中文和表情，避免数据库乱码
}).promise(); // 启用 Promise 风格，方便使用 async/await 语法

// 5. 核心：微信登录接口（小程序端调用这个接口，换取 openid 并写入 wx_user 表）
app.post('/api/wx/login', async (req, res) => {
  try {
    // 步骤 1：接收小程序传递的临时登录凭证 code
    const { code } = req.body;
    if (!code) {
      return res.json({
        code: 400,
        msg: '缺少微信登录凭证 code，请先获取 code'
      });
    }

    // 步骤 2：配置微信官方接口的请求参数（读取 .env 中的微信配置）
    const wxLoginParams = {
      appid: process.env.WX_APPID,
      secret: process.env.WX_SECRET,
      js_code: code,
      grant_type: 'authorization_code' // 固定值，无需修改，微信要求的授权类型
    };

    // 步骤 3：调用微信官方接口，换取 openid 和 session_key
    const wxResponse = await axios.get(process.env.WX_LOGIN_URL, {
      params: wxLoginParams
    });

    // 步骤 4：处理微信接口的返回结果
    const wxData = wxResponse.data;
    // 如果微信接口返回错误码（如 AppID 错误、code 过期），直接返回给小程序
    if (wxData.errcode) {
      return res.json({
        code: 500,
        msg: `微信登录失败：${wxData.errmsg}`,
        detail: wxData // 返回详细错误信息，方便排查问题
      });
    }

    // 步骤 5：提取微信接口返回的核心数据（openid 是小程序内用户唯一标识）
    const { openid, session_key } = wxData;

    // 步骤 6：操作 MySQL 数据库，实现「首次登录创建用户，重复登录不重复插入」
    // 先查询该 openid 是否已经存在于 wx_user 表中
    const [existUserList] = await dbPool.query(
      'SELECT * FROM `wx_user` WHERE `openid` = ?',
      [openid] // 用占位符传递参数，避免 SQL 注入风险
    );

    if (existUserList.length > 0) {
      // 情况 1：用户已存在，直接返回用户信息，不重复插入
      return res.json({
        code: 200,
        msg: '登录成功（用户已存在）',
        data: {
          user: existUserList[0], // 返回已存在的用户数据
          session_key: session_key // 返回 session_key（小程序端可用于解密用户昵称/头像，无需存储到数据库）
        }
      });
    } else {
      // 情况 2：用户不存在，插入新用户（仅填充核心字段 openid，其他字段后续可补充）
      await dbPool.query(
        'INSERT INTO `wx_user` (`openid`) VALUES (?)',
        [openid]
      );

      // 插入成功后，查询新增的用户数据，返回给小程序
      const [newUserList] = await dbPool.query(
        'SELECT * FROM `wx_user` WHERE `openid` = ?',
        [openid]
      );

      return res.json({
        code: 200,
        msg: '登录成功（新用户已创建）',
        data: {
          user: newUserList[0], // 返回新增的用户数据
          session_key: session_key
        }
      });
    }

  } catch (error) {
    // 步骤 7：捕获全局异常，避免服务崩溃，同时返回错误信息方便排查
    console.error('微信登录接口全局异常：', error);
    res.json({
      code: 500,
      msg: '服务器内部错误，请稍后再试',
      error_detail: error.message // 本地开发阶段返回错误详情，上线后可删除
    });
  }
});

// 6. 额外：测试接口（用于验证 Node 服务和 MySQL 连接是否正常，可选）
app.get('/api/test', async (req, res) => {
  try {
    // 查询 wx_user 表中的所有用户数据
    const [userList] = await dbPool.query('SELECT * FROM `wx_user` ORDER BY `create_t` DESC');
    res.json({
      code: 200,
      msg: '连接成功，这是测试接口返回的数据',
      data: {
        user_count: userList.length,
        user_list: userList
      }
    });
  } catch (error) {
    res.json({
      code: 500,
      msg: '测试接口异常，数据库连接失败',
      error: error.message
    });
  }
});

// 7. 启动 Node.js 服务，监听 3000 端口
app.listen(port, () => {
  console.log(`✅ Node.js 服务已成功启动`);
  console.log(`🔗 本地服务地址：http://localhost:${port}`);
  console.log(`📌 微信登录接口：http://localhost:${port}/api/wx/login`);
  console.log(`📌 测试接口：http://localhost:${port}/api/test`);
});