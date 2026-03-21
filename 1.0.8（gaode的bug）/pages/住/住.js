Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 住模块功能列表（用于wxml循环渲染）
    funcList: [
      {
        key: 'rent',
        icon: '/images/rent-icon.png',
        name: '租房信息',
        desc: '海量房源 随时看房'
      },
      {
        key: 'hotel',
        icon: '/images/hotel-icon.png',
        name: '酒店预订',
        desc: '特价酒店 一键预订'
      },
      {
        key: 'property',
        icon: '/images/property-icon.png',
        name: '物业服务',
        desc: '物业费 通知公告'
      },
      {
        key: 'repair',
        icon: '/images/repair-icon.png',
        name: '维修报修',
        desc: '快速响应 上门维修'
      }
    ],
    // 用户信息（用于判断是否登录）
    userInfo: null,
    // 加载状态
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 调试：打印全局基础地址
    const app = getApp();
    console.log('【住模块首页】全局基础地址：', app.getBaseUrl());
    
    // 加载用户信息
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时刷新用户信息
    this.getUserInfo();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({ isLoading: true });
    this.getUserInfo(() => {
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
      wx.showToast({ title: '已刷新用户信息', icon: 'none', duration: 1000 });
    });
  },

  /**
   * 获取用户信息（从缓存读取 + 增强容错）
   */
  getUserInfo(callback) {
    try {
      // 兼容不同存储方式：字符串/对象
      let userInfo = wx.getStorageSync('userInfo');
      const userId = wx.getStorageSync('userId');
      const token = wx.getStorageSync('token');

      // 解析JSON字符串
      if (userInfo && typeof userInfo === 'string') {
        try {
          userInfo = JSON.parse(userInfo);
        } catch (e) {
          userInfo = null;
        }
      }

      // 完整登录态校验：必须有userId + token
      const isLogin = !!userId && !!token && userInfo;
      
      this.setData({
        userInfo: isLogin ? userInfo : null
      });
      
      callback && callback();
    } catch (err) {
      console.error('获取用户信息失败详情：', err);
      this.setData({ userInfo: null });
      callback && callback();
    }
  },

  /**
   * 点击事件：跳转到当前“住”模块下的子页面（修复版）
   */
  handleTap(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) {
      wx.showToast({ title: '功能标识异常', icon: 'none' });
      return;
    }

    // 登录校验（核心功能需要登录）
    const needLogin = ['rent', 'hotel', 'repair', 'property'];
    
    // 构建回跳路径（登录后返回当前页）
    const currentPagePath = '/pages/住/住';
    const loginRedirectUrl = encodeURIComponent(currentPagePath);

    // 需要登录但未登录
    if (needLogin.includes(key) && !this.data.userInfo) {
      wx.showModal({
        title: '温馨提示',
        content: '请先登录后使用该功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            try {
              wx.navigateTo({
                url: `/pages/login/login?redirect=${loginRedirectUrl}`
              });
            } catch (err) {
              console.error('跳转登录页失败：', err);
              wx.showToast({ title: '登录页面未配置', icon: 'none' });
            }
          }
        }
      });
      return;
    }

    // 🔥 核心修复：路径映射改为项目中实际存在的页面路径
    const pathMap = {
      rent: '/pages/住/rentList/rentList',          // 修复：rental → rentList
      hotel: '/pages/住/hotelList/hotelList',      // 保持不变（路径正确）
      property: '/pages/住/propertyNotices/propertyNotices', // 修复：property/notice → propertyNotices
      repair: '/pages/住/repairOrder/repairOrder'  // 保持不变（路径正确）
    };

    const targetPath = pathMap[key];
    if (targetPath) {
      // 跳转逻辑：仅使用navigateTo（非tabBar页面），移除多余容错（避免混淆）
      try {
        wx.navigateTo({
          url: targetPath,
          fail: (err) => {
            console.error(`跳转${key}页面失败：`, err);
            wx.showToast({ 
              title: `无法打开${this.getFuncName(key)}页面`, 
              icon: 'none' 
            });
          }
        });
      } catch (err) {
        console.error(`跳转${key}页面异常：`, err);
        wx.showToast({ 
          title: `${this.getFuncName(key)}功能暂未开放`, 
          icon: 'none' 
        });
      }
    } else {
      wx.showToast({ title: `${this.getFuncName(key)}功能待接入`, icon: 'none' });
    }
  },

  /**
   * 获取功能名称（用于友好提示）
   */
  getFuncName(key) {
    const nameMap = {
      rent: '租房信息',
      hotel: '酒店预订',
      property: '物业服务',
      repair: '维修报修'
    };
    return nameMap[key] || '该';
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可扩展：加载更多功能/推荐内容
    wx.showToast({ title: '已加载全部功能', icon: 'none', duration: 1000 });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '生活服务-住模块',
      path: '/pages/住/住',
      imageUrl: '/images/share-cover.png',
      // 分享成功回调
      success: () => {
        wx.showToast({ title: '分享成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '分享失败', icon: 'none' });
      }
    };
  },

  /**
   * 返回上一级页面（新增：适配自定义返回按钮）
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({ url: '/pages/index/index' });
        }
      });
    } else {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  }
});