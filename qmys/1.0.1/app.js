// app.js
App({
  // 全局数据：存储是否已登录、需要跳转的目标页面
  globalData: {
    isLogin: false,
    token: '',
    redirectPage: '' // 存储需要跳转的目标页面路径
  },
  // 小程序启动时执行
  onLaunch(options) {
    this.checkLoginStatus(options);
  },
  "plugins": {
    "amap-plugin": {
      "version": "1.0.0",
      "provider": "wx5bc2ac602a747594"
    }
  },
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于查找附近医院"
    }
  },
  // 小程序切回前台时执行（防止用户退出后重新进入未校验）
  onShow(options) {
    this.checkLoginStatus(options);
  },

  // 校验登录状态的核心方法
  checkLoginStatus(options) {
    // 1. 从本地缓存获取登录态（token）
    const token = wx.getStorageSync('token');
    this.globalData.token = token;
    this.globalData.isLogin = !!token; // 有token则视为已登录

    // 2. 获取当前要进入的页面路径（处理启动参数）
    let currentPage = '';
    if (options.scene === 1001) { // 小程序主入口启动
      currentPage = '/pages/index/index'; // 默认首页
    } else if (options.path) { // 从其他场景（如分享、扫码）启动
      currentPage = `/${options.path}`;
    }

    // 3. 白名单：不需要登录的页面（仅登录页）
    const whiteList = ['/pages/login/login'];
    // 排除白名单 + 未登录 → 跳转到登录页
    if (!this.globalData.isLogin && !whiteList.includes(currentPage)) {
      // 存储目标页面，登录成功后跳转回去
      this.globalData.redirectPage = currentPage;
      // 跳转到登录页（使用redirectTo，避免返回栈有首页）
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  }
});