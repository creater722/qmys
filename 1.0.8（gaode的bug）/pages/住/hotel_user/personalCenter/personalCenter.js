// pages/住/hotel_user/personalCenter/personalCenter.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickname: '未登录',
      phone: '',
      avatar: '/images/default-avatar.png' // 可替换为网络头像
    },
    isLogin: false,
    menuList: [
      {
        title: '我的订单',
        icon: 'icon-order',
        path: '/pages/住/hotel_user/orderList/orderList',
        badge: ''
      },
      {
        title: '我的收藏',
        icon: 'icon-collect',
        path: '/pages/住/hotel_user/collectList/collectList',
        badge: ''
      },
      {
        title: '我是店家', // 新增：我是店家
        icon: 'icon-shop', // 可替换为你自己的图标类名
        path: '/pages/住/hotel_user/addHotel/addHotel', // 跳转路径
        badge: ''
      },
      {
        title: '联系客服',
        icon: 'icon-service',
        path: '',
        badge: ''
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示都刷新用户信息（登录/退出后实时更新）
    this.getUserInfo();
  },

  /**
   * 获取用户信息（兼容全局登录态，提升鲁棒性）
   */
  getUserInfo() {
    try {
      // 1. 读取本地存储
      const localUserId = wx.getStorageSync('userId');
      const localToken = wx.getStorageSync('token');
      const localNickname = wx.getStorageSync('nickname') || '微信用户';
      const localPhone = wx.getStorageSync('phone') || '';
      
      // 2. 读取全局登录态（兜底）
      const app = getApp();
      const globalUserId = app.globalData.userId || '';
      const globalToken = app.globalData.token || '';
      const globalNickname = app.globalData.nickname || '';
      const globalPhone = app.globalData.phone || '';

      // 3. 最终登录态（优先本地，兜底全局）
      const userId = localUserId || globalUserId;
      const token = localToken || globalToken;
      const nickname = localNickname || globalNickname || '微信用户';
      const phone = localPhone || globalPhone;
      const isLogin = !!userId && !!token;

      // 4. 更新页面状态
      this.setData({
        isLogin,
        userInfo: {
          nickname: isLogin ? nickname : '未登录',
          phone: isLogin ? (phone || '未绑定手机号') : '请先登录',
          avatar: '/images/default-avatar.png'
        }
      });

      console.log('【个人中心】用户信息：', {
        isLogin,
        nickname,
        phone
      });
    } catch (err) {
      console.error('获取用户信息失败：', err);
      this.setData({
        isLogin: false,
        userInfo: {
          nickname: '未登录',
          phone: '请先登录',
          avatar: '/images/default-avatar.png'
        }
      });
    }
  },

  /**
   * 跳转登录页（优化：带返回地址）
   */
  goToLogin() {
    if (this.data.isLogin) return;
    // 登录后返回当前页面
    const currentPage = '/pages/住/hotel_user/personalCenter/personalCenter';
    wx.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(currentPage)}`
    });
  },

  /**
   * 菜单点击事件（优化：增加错误捕获）
   */
  onMenuTap(e) {
    const { path } = e.currentTarget.dataset;
    if (!path) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }

    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.goToLogin();
      return;
    }

    // 增加跳转错误捕获
    try {
      wx.navigateTo({ 
        url: path,
        fail: (err) => {
          console.error('跳转失败：', err);
          // 兜底：使用redirectTo跳转
          wx.redirectTo({ url: path });
        }
      });
    } catch (err) {
      wx.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  },

  /**
   * 退出登录（优化：清空所有相关存储）
   */
  logout() {
    if (!this.data.isLogin) return;

    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 1. 清除本地所有登录相关存储
            const clearKeys = ['userId', 'token', 'nickname', 'phone', 'isLogin', 'user_id', 'openid'];
            clearKeys.forEach(key => {
              wx.removeStorageSync(key);
            });

            // 2. 清空全局数据
            const app = getApp();
            app.globalData = {
              ...app.globalData,
              userId: '',
              token: '',
              nickname: '',
              phone: '',
              isLogin: false
            };

            // 3. 更新页面状态
            this.setData({
              isLogin: false,
              userInfo: {
                nickname: '未登录',
                phone: '请先登录',
                avatar: '/images/default-avatar.png'
              }
            });

            wx.showToast({ title: '退出成功', icon: 'success' });
          } catch (err) {
            console.error('退出登录失败：', err);
            wx.showToast({ title: '退出失败，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 返回上一页（优化：兼容页面栈）
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // 页面栈只有当前页，跳转到首页
      wx.redirectTo({ url: '/pages/index/index' });
    }
  },

  /**
   * 跳转添加酒店页面（已整合到menuList，保留兼容）
   */
  goToShop() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.goToLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/住/hotel_user/addHotel/addHotel'
    });
  },
  
  /**
   * 下拉刷新（优化：缩短刷新时间）
   */
  onPullDownRefresh() {
    this.getUserInfo();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500); // 缩短为500ms，体验更流畅
  }
});