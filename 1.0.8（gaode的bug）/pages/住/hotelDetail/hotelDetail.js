Page({
  data: {
    hotel: {},        
    isCollected: false,
    userId: ''        
  },
  // 页面变量存储登录态
  pageUserId: '',
  hotelId: '',
  pageToken: '',
  pageIsLogin: false,

  /**
   * 页面加载
   */
  onLoad(options) {
    // 全局唯一App实例
    const app = getApp();
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.hotelId = id;
    this.getLoginStateSync();
    this.loadHotelDetail(id);
  },

  /**
   * 页面显示（每次进入刷新收藏状态）
   */
  onShow() {
    this.getLoginStateSync();
    if (this.hotelId && this.pageUserId) {
      this.checkCollectionStatus(this.hotelId);
    }
  },

  /**
   * 同步获取登录态（最终兼容版）
   */
  getLoginStateSync() {
    try {
      console.log('===== 登录态调试日志 =====');
      const storageAll = wx.getStorageInfoSync();
      console.log('本地存储所有key：', storageAll.keys);
      
      // 兼容所有可能的userID存储key
      const localUserId = wx.getStorageSync('userId') || 
                         wx.getStorageSync('user_id') || 
                         wx.getStorageSync('usererId') || 
                         wx.getStorageSync('openid') || 
                         wx.getStorageSync('uid') || 
                         '';
      // 兼容布尔/字符串类型的isLogin
      const localIsLogin = wx.getStorageSync('isLogin') === true || wx.getStorageSync('isLogin') === 'true';
      const localToken = wx.getStorageSync('token') || '';

      console.log('本地存储解析后：', {
        userId: localUserId,
        isLogin: localIsLogin,
        token: localToken
      });

      // 全局应用实例兜底
      const app = getApp();
      const globalUserId = app.globalData.userId || '';
      const globalIsLogin = app.globalData.isLogin || false;
      const globalToken = app.globalData.token || '';

      console.log('全局登录态：', {
        userId: globalUserId,
        token: globalToken,
        isLogin: globalIsLogin
      });

      // 最终赋值（优先本地，兜底全局）
      this.pageUserId = String(localUserId || globalUserId).trim() || '';
      this.pageToken = String(localToken || globalToken).trim() || '';
      this.pageIsLogin = localIsLogin || globalIsLogin;

      // 同步更新data
      this.setData({ userId: this.pageUserId });

      console.log('最终登录态（最终版）：', {
        userId: this.pageUserId,
        token: this.pageToken,
        isLogin: this.pageIsLogin
      });
    } catch (err) {
      console.error('读取登录态失败：', err);
      this.pageUserId = '';
      this.pageToken = '';
      this.pageIsLogin = false;
      this.setData({ userId: '' });
    }
  },

  /**
   * 加载酒店详情（适配新关联结构 + 修复 split 报错）
   */
  loadHotelDetail(id) {
    const app = getApp();
    wx.showLoading({ title: '加载中' });

    wx.request({
      url: `${app.getBaseUrl()}/api/hotels/${id}`,
      method: 'GET',
      timeout: 10000,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        console.log('酒店详情接口返回：', res);
        if (res.data?.code === 200) {
          const data = res.data.data;
          // 适配新结构：关联对象转名称数组
          this.setData({ 
            hotel: {
              ...data,
              // 兼容设施/服务字段
              facilities: (data.hotelFacilities || []).map(item => item.name || ''),
              services: (data.hotelServices || []).map(item => item.name || ''),
              // 适配房型字段，修复split报错
              rooms: (data.rooms || []).map(room => {
                // 安全处理房型设施
                let roomFacilities = [];
                if (typeof room.room_facilities === 'string' && room.room_facilities) {
                  roomFacilities = room.room_facilities.split(',').filter(Boolean); // 过滤空值
                } else if (Array.isArray(room.room_facilities)) {
                  roomFacilities = room.room_facilities.filter(Boolean);
                }

                return {
                  id: room.id || '',
                  roomType: room.room_name || room.roomType || '未知房型',
                  bedCount: room.bed_type ? (room.bed_type.includes('单') ? 1 : 2) : 1,
                  area: room.area || '暂无数据',
                  facilities: roomFacilities,
                  price: Number(room.current_price || room.price || 0) // 强制转数字
                };
              })
            } 
          });
        } else {
          wx.showToast({ title: res.data?.message || '加载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('酒店详情请求失败：', err);
        wx.showToast({ title: '服务器连接失败，请稍后重试', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /**
   * 返回上一页（兼容页面栈）
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  },

  /**
   * 检查收藏状态
   */
  checkCollectionStatus(hotelId) {
    const app = getApp();
    if (!hotelId || !this.pageUserId) {
      console.log('跳过收藏状态检查：参数不全');
      return;
    }

    wx.request({
      url: `${app.getBaseUrl()}/api/user/favorites/check`,
      method: 'POST',
      timeout: 10000,
      header: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.pageToken}`
      },
      data: {
        userId: this.pageUserId,
        favType: 'hotel',
        targetId: hotelId
      },
      success: (res) => {
        console.log('收藏状态检查返回：', res);
        if ([200, 0].includes(res.data?.code)) {
          this.setData({ isCollected: Boolean(res.data.data) });
        }
      },
      fail: (err) => {
        console.error('检查收藏状态失败：', err);
      }
    });
  },

  /**
   * 收藏/取消收藏酒店
   */
  collectHotel(e) {
    this.getLoginStateSync();
    console.log('收藏按钮点击 - 当前登录态：', this.pageUserId);

    // 登录校验
    if (!this.pageIsLogin || !this.pageUserId || !this.pageToken) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      const redirectUrl = encodeURIComponent(`/pages/住/hotelDetail/hotelDetail?id=${this.hotelId}`);
      try {
        wx.navigateTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      } catch (err) {
        wx.redirectTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      }
      return;
    }

    const hotelId = e.currentTarget.dataset.id || this.hotelId;
    const action = this.data.isCollected ? 'cancel' : 'add';
    const app = getApp();

    wx.request({
      url: `${app.getBaseUrl()}/api/user/favorites/${action}`,
      method: 'POST',
      timeout: 10000,
      header: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.pageToken}`
      },
      data: {
        userId: this.pageUserId,
        favType: 'hotel',
        targetId: hotelId
      },
      success: (res) => {
        console.log('收藏接口返回：', res);
        if ([200, 0].includes(res.data?.code)) {
          this.setData({ isCollected: !this.data.isCollected });
          wx.showToast({ 
            title: this.data.isCollected ? '收藏成功' : '取消收藏成功',
            icon: 'success'
          });
        } else {
          wx.showToast({ title: res.data?.message || '操作失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('收藏请求失败：', err);
        wx.showToast({ title: '服务器连接失败', icon: 'none' });
      }
    });
  },

  /**
   * 拨打酒店电话
   */
  callHotel() {
    const phone = this.data.hotel.phone;
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '暂无有效酒店电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨打电话失败，请手动拨打', icon: 'none' });
      }
    });
  },

  /**
   * 预订房间（终极修复版）
   */
  bookRoom(e) {
    console.log('===== 预订按钮点击触发 =====', e);
    
    // 强制刷新登录态
    this.getLoginStateSync();
    
    // 兼容多种dataset命名方式
    const dataset = e.currentTarget?.dataset || {};
    const realRoomId = dataset.roomId || dataset.room_id || dataset['room-id'] || '';
    const realHotelId = dataset.hotelId || dataset.hotel_id || dataset['hotel-id'] || this.hotelId;

    console.log('预订参数解析：', {
      roomId: realRoomId,
      hotelId: realHotelId,
      isLogin: this.pageIsLogin
    });

    // 校验房型ID
    if (!realRoomId) {
      wx.showToast({ title: '房型参数错误，请重试', icon: 'none' });
      return;
    }

    // 登录校验
    if (!this.pageIsLogin || !this.pageUserId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      const redirectUrl = encodeURIComponent(`/pages/住/hotelDetail/hotelDetail?id=${realHotelId}`);
      try {
        wx.navigateTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      } catch (err) {
        wx.redirectTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      }
      return;
    }

    // 跳转到订单确认页
    try {
      wx.navigateTo({
        url: `/pages/住/hotel_user/orderConfirm/orderConfirm?hotelId=${realHotelId}&roomId=${realRoomId}`
      });
    } catch (err) {
      console.error('跳转订单页失败：', err);
      wx.showToast({ title: '页面跳转失败，请重试', icon: 'none' });
      // 兜底跳转
      wx.redirectTo({
        url: `/pages/住/hotel_user/orderConfirm/orderConfirm?hotelId=${realHotelId}&roomId=${realRoomId}`
      });
    }
  },

  /**
   * 底部预订按钮：滚动到房型列表
   */
  showRoomList() {
    wx.pageScrollTo({
      selector: '.room-list',
      duration: 300
    });
    wx.showToast({ title: '请选择房型后点击「立即预订」', icon: 'none', duration: 2000 });
  }
});