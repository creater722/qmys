Page({
  data: {
    hotel: {},        // 酒店详情
    isCollected: false, // 是否已收藏
    userId: ''        // 初始化空值，在onShow中动态获取
  },

  /**
   * 页面加载
   */
  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    // 存储酒店ID，供后续复用
    this.hotelId = id;
    // 首次加载先获取登录态
    this.getLoginState();
    // 加载酒店详情（无需登录也能看）
    this.loadHotelDetail(id);
  },

  /**
   * 页面显示（每次进入页面都刷新登录态）
   */
  onShow() {
    // 关键修复：每次显示页面都重新读取登录态
    this.getLoginState();
    // 如果有酒店ID且已登录，重新检查收藏状态
    if (this.hotelId && this.data.userId) {
      this.checkCollectionStatus(this.hotelId);
    }
  },

  /**
   * 统一获取登录态（核心修复）
   */
  getLoginState() {
    try {
      // 兼容两种常见的userId存储key
      const userId = wx.getStorageSync('userId') || wx.getStorageSync('user_id') || '';
      // 额外校验登录标记（如果登录页有存储）
      const isLogin = wx.getStorageSync('isLogin') || false;
      
      // 双重校验：有userId且标记为已登录
      const finalUserId = (userId && isLogin) ? userId : '';
      
      this.setData({
        userId: finalUserId
      });
    } catch (err) {
      console.error('读取登录态失败：', err);
      this.setData({ userId: '' });
    }
  },

  /**
   * 加载酒店详情
   */
  loadHotelDetail(id) {
    wx.showLoading({ title: '加载中' });

    wx.request({
      url: `http://localhost:3000/api/hotels/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ hotel: res.data.data });
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 检查收藏状态
   */
  checkCollectionStatus(hotelId) {
    // 增加空值校验
    if (!hotelId || !this.data.userId) return;

    wx.request({
      url: `http://localhost:3000/api/user/favorites/check`,
      method: 'POST',
      data: {
        userId: this.data.userId,
        favType: 'hotel',
        targetId: hotelId
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ isCollected: res.data.data });
        }
      },
      fail: (err) => {
        console.error('检查收藏状态失败：', err);
      }
    });
  },

  /**
   * 收藏酒店
   */
  collectHotel(e) {
    // 先刷新登录态，再校验
    this.getLoginState();
    if (!this.data.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      // 记录当前页面，登录后可返回
      wx.navigateTo({ 
        url: `/pages/login/login?redirect=/pages/住/hotelDetail/hotelDetail?id=${this.hotelId}` 
      });
      return;
    }

    const hotelId = e.currentTarget.dataset.id;
    const action = this.data.isCollected ? 'cancel' : 'add';

    wx.request({
      url: `http://localhost:3000/api/user/favorites/${action}`,
      method: 'POST',
      data: {
        userId: this.data.userId,
        favType: 'hotel',
        targetId: hotelId
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ isCollected: !this.data.isCollected });
          wx.showToast({ title: this.data.isCollected ? '收藏成功' : '取消收藏成功' });
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('收藏操作失败：', err);
        wx.showToast({ title: '操作失败，请重试', icon: 'none' });
      }
    });
  },

  /**
   * 拨打酒店电话
   */
  callHotel() {
    const phone = this.data.hotel.phone;
    if (!phone) {
      wx.showToast({ title: '暂无酒店电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨打电话失败', icon: 'none' });
      }
    });
  },

  /**
   * 预订房间
   */
  bookRoom(e) {
    // 先刷新登录态，再校验
    this.getLoginState();
    const { roomId, hotelId } = e.currentTarget.dataset;
    if (!this.data.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      // 记录当前酒店和房间ID，登录后可返回
      wx.navigateTo({ 
        url: `/pages/login/login?redirect=/pages/住/hotelBook/hotelBook?hotelId=${hotelId}&roomId=${roomId}` 
      });
      return;
    }

    // 跳转到预订页面
    wx.navigateTo({
      url: `/pages/住/hotelBook/hotelBook?hotelId=${hotelId}&roomId=${roomId}`
    });
  },

  /**
   * 显示房型列表
   */
  showRoomList() {
    // 滚动到房型列表位置
    wx.pageScrollTo({
      selector: '.room-list',
      duration: 300
    });
  }
});