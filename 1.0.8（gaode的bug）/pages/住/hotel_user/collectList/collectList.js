// pages/住/hotel_user/collectList/collectList.js
Page({
  data: {
    collectList: [],      // 收藏列表数据
    isEmpty: false,       // 是否为空列表
    loading: false,       // 加载状态
    pageUserId: '',       // 当前登录用户ID
    pageToken: '',        // 用户token
    pageIsLogin: false    // 是否登录
  },

  /**
   * 页面加载
   */
  onLoad(options) {
    this.getLoginStateSync();
    if (this.data.pageIsLogin && this.data.pageUserId) {
      this.loadCollectList();
    } else {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  /**
   * 页面显示（每次进入都刷新列表）
   */
  onShow() {
    if (this.data.pageIsLogin && this.data.pageUserId) {
      this.loadCollectList();
    }
  },

  /**
   * 同步获取登录态
   */
  getLoginStateSync() {
    try {
      // ✅ 定义 app 实例
      const app = getApp();
      const localUserId = wx.getStorageSync('userId') || wx.getStorageSync('user_id') || '';
      const localIsLogin = wx.getStorageSync('isLogin') === true || wx.getStorageSync('isLogin') === 'true';
      const localToken = wx.getStorageSync('token') || '';

      // 全局应用实例兜底
      const globalUserId = app.globalData.userId || '';
      const globalIsLogin = app.globalData.isLogin || false;
      const globalToken = app.globalData.token || '';

      // 最终赋值
      const userId = localUserId || globalUserId;
      const isLogin = localIsLogin || globalIsLogin;
      const token = localToken || globalToken;

      this.setData({
        pageUserId: userId,
        pageIsLogin: isLogin,
        pageToken: token
      });
    } catch (err) {
      console.error('读取登录态失败：', err);
      this.setData({
        pageUserId: '',
        pageIsLogin: false,
        pageToken: ''
      });
    }
  },

  /**
   * 加载收藏列表
   */
  loadCollectList() {
    if (!this.data.pageUserId) return;

    // ✅ 定义 app 实例
    const app = getApp();
    this.setData({ loading: true });

    wx.request({
      // ✅ 核心修复1：用反引号 + 去掉多余的 http://
      url: `${app.getBaseUrl()}/api/user/favorites/list`,
      method: 'POST',
      timeout: 10000, // ✅ 增加超时时间
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.pageToken}`
      },
      data: {
        userId: this.data.pageUserId,
        favType: 'hotel'
      },
      success: (res) => {
        console.log('收藏列表返回：', res);
        if (res.data?.code === 200) {
          const list = res.data.data?.list || [];
          this.setData({
            collectList: list,
            isEmpty: list.length === 0
          });
        } else {
          wx.showToast({ title: res.data?.message || '加载收藏列表失败', icon: 'none' });
          this.setData({ isEmpty: true });
        }
      },
      fail: (err) => {
        console.error('加载收藏列表失败：', err);
        wx.showToast({ title: '服务器连接失败，无法加载收藏列表', icon: 'none' });
        this.setData({ isEmpty: true });
      },
      complete: () => {
        this.setData({ loading: false });
        // 停止下拉刷新
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 取消收藏
   */
  cancelCollect(e) {
    const { hotelid, index } = e.currentTarget.dataset;
    if (!hotelid) return;

    wx.showModal({
      title: '提示',
      content: '确定取消收藏该酒店吗？',
      success: (modalRes) => {
        if (modalRes.confirm) {
          this.doCancelCollect(hotelid, index);
        }
      }
    });
  },

  /**
   * 执行取消收藏操作
   */
  doCancelCollect(hotelId, index) {
    // ✅ 定义 app 实例
    const app = getApp();
    wx.request({
      // ✅ 核心修复2：用反引号 + 去掉多余的 http://
      url: `${app.getBaseUrl()}/api/user/favorites/cancel`,
      method: 'POST',
      timeout: 10000, // ✅ 增加超时时间
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.data.pageToken}`
      },
      data: {
        userId: this.data.pageUserId,
        favType: 'hotel',
        targetId: hotelId
      },
      success: (res) => {
        if (res.data?.code === 200) {
          wx.showToast({ title: '取消收藏成功', icon: 'success' });
          // 更新列表（删除对应项）
          const newList = [...this.data.collectList];
          newList.splice(index, 1);
          this.setData({
            collectList: newList,
            isEmpty: newList.length === 0
          });
        } else {
          wx.showToast({ title: res.data?.message || '取消收藏失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('取消收藏失败：', err);
        wx.showToast({ title: '服务器连接失败，取消收藏失败', icon: 'none' });
      }
    });
  },

  /**
   * 跳转到酒店详情页
   */
  goToHotelDetail(e) {
    const { hotelid } = e.currentTarget.dataset;
    if (hotelid) {
      wx.navigateTo({
        url: `/pages/住/hotelDetail/hotelDetail?id=${hotelid}`
      });
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadCollectList();
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
});