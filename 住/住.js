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
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
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
    this.getUserInfo(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 获取用户信息（从缓存读取）
   */
  getUserInfo(callback) {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      const userId = wx.getStorageSync('userId');
      this.setData({
        userInfo: userInfo ? (typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo) : null
      });
      callback && callback();
    } catch (err) {
      console.error('获取用户信息失败：', err);
      this.setData({ userInfo: null });
      callback && callback();
    }
  },

  /**
   * 点击事件：跳转到当前“住”模块下的子页面
   */
  handleTap(e) {
    const key = e.currentTarget.dataset.key;
    // 登录校验（核心功能需要登录）
    const needLogin = ['rent', 'hotel', 'repair', 'property'];
    
    // 构建回跳路径（登录后返回当前页）
    const currentPagePath = '/pages/住/住';
    const loginRedirectUrl = encodeURIComponent(currentPagePath);

    if (needLogin.includes(key) && !this.data.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后使用该功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              // 携带回跳参数，登录后返回当前页
              url: `/pages/login/login?redirect=${loginRedirectUrl}`
            });
          }
        }
      });
      return;
    }

    // 映射关系：key对应“住”模块下的子页面路径
    const pathMap = {
      rent: '/pages/住/rentList/rentList',                // 租房信息
      hotel: '/pages/住/hotelList/hotelList',            // 酒店预订
      property: '/pages/住/propertyNotices/propertyNotices', // 物业服务
      repair: '/pages/住/repairOrder/repairOrder'        // 维修报修
    };

    const targetPath = pathMap[key];
    if (targetPath) {
      // 直接跳转（页面是否存在由app.json注册保证）
      wx.navigateTo({
        url: targetPath,
        fail: (err) => {
          console.error('跳转失败：', err);
          // 容错：尝试用 redirectTo 跳转
          wx.redirectTo({
            url: targetPath,
            fail: () => {
              wx.showToast({ title: '页面未配置，请检查app.json', icon: 'none' });
            }
          });
        }
      });
    } else {
      wx.showToast({ title: '功能待接入', icon: 'none' });
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可扩展：加载更多功能/推荐内容
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '生活服务-住模块',
      path: '/pages/住/住',
      imageUrl: '/images/share-cover.png'
    };
  }
});