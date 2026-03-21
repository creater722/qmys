Page({
  /**
   * 页面的初始数据
   */
  data: {
    supermarket: {
      id: 1,
      name: '永辉超市',
      address: '北京市朝阳区建国路88号',
      hours: '08:00-22:00',
      distance: 500,
      phone: '010-12345678',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20supermarket%20interior&image_size=landscape_16_9',
      features: ['免费停车', '生鲜蔬菜', '日用品齐全', '24小时营业', '会员优惠'],
      reviews: [
        {
          user: '张三',
          rating: 5,
          content: '超市很大，东西很齐全，价格也实惠，推荐！',
          time: '2024-01-15'
        },
        {
          user: '李四',
          rating: 4,
          content: '服务态度很好，就是人有点多，结账需要排队。',
          time: '2024-01-10'
        }
      ]
    },
    isCollected: false,
    userInfo: null
  },
  pageUserId: '',
  pageToken: '',
  pageIsLogin: false,
  supermarketId: '',

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const id = options.id;
    this.supermarketId = id;
    this.getLoginStateSync();
    
    if (id) {
      const supermarketFromList = {
        id: parseInt(id),
        name: decodeURIComponent(options.name || ''),
        address: decodeURIComponent(options.address || ''),
        distance: options.distance || 0,
        latitude: parseFloat(options.latitude || 0),
        longitude: parseFloat(options.longitude || 0),
        phone: '',
        hours: '08:00-22:00',
        features: ['生鲜蔬菜', '日用品齐全'],
        image: '/分类logo/超市.png'
      };
      
      if (options.name) {
        this.setData({ supermarket: supermarketFromList });
      } else {
        this.loadSupermarketDetail(id);
      }
      
      this.checkCollectionStatus(id);
    }
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getLoginStateSync();
    this.getUserInfo();
    if (this.supermarketId && this.pageUserId) {
      this.checkCollectionStatus(this.supermarketId);
    }
  },

  /**
   * 同步获取登录态
   */
  getLoginStateSync() {
    try {
      const localUserId = wx.getStorageSync('userId') || 
                         wx.getStorageSync('user_id') || 
                         wx.getStorageSync('openid') || 
                         '';
      const localIsLogin = wx.getStorageSync('isLogin') === true || wx.getStorageSync('isLogin') === 'true';
      const localToken = wx.getStorageSync('token') || '';

      const app = getApp();
      const globalUserId = app.globalData.userId || '';
      const globalIsLogin = app.globalData.isLogin || false;
      const globalToken = app.globalData.token || '';

      this.pageUserId = String(localUserId || globalUserId).trim() || '';
      this.pageToken = String(localToken || globalToken).trim() || '';
      this.pageIsLogin = localIsLogin || globalIsLogin;
    } catch (err) {
      console.error('读取登录态失败：', err);
      this.pageUserId = '';
      this.pageToken = '';
      this.pageIsLogin = false;
    }
  },

  /**
   * 加载超市详情（数据库接口）
   */
  loadSupermarketDetail(id) {
    const app = getApp();
    
    if (this.pageUserId && this.pageToken) {
      wx.showLoading({ title: '加载中' });

      wx.request({
        url: `${app.getBaseUrl()}/api/supermarkets/${id}`,
        method: 'GET',
        timeout: 10000,
        header: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pageToken}`
        },
        success: (res) => {
          console.log('超市详情接口返回：', res);
          if (res.data?.code === 200 && res.data.data) {
            const data = res.data.data;
            this.setData({ 
              supermarket: {
                id: data.id || id,
                name: data.name || '未知超市',
                address: data.address || '暂无地址',
                hours: data.hours || '08:00-22:00',
                distance: data.distance || 0,
                phone: data.phone || '',
                image: data.image || '/分类logo/超市.png',
                features: Array.isArray(data.features) ? data.features : ['生鲜蔬菜', '日用品齐全'],
                reviews: Array.isArray(data.reviews) ? data.reviews : []
              }
            });
          } else {
            wx.showToast({ title: res.data?.message || '加载失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('超市详情请求失败：', err);
          wx.showToast({ title: '服务器连接失败，使用本地数据', icon: 'none' });
          this.loadLocalSupermarketDetail(id);
        },
        complete: () => {
          wx.hideLoading();
        }
      });
    } else {
      this.loadLocalSupermarketDetail(id);
    }
  },

  /**
   * 加载本地超市详情
   */
  loadLocalSupermarketDetail(id) {
    const supermarkets = [
      {
        id: 1,
        name: '永辉超市',
        address: '北京市朝阳区建国路88号',
        hours: '08:00-22:00',
        distance: 500,
        phone: '010-12345678',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20supermarket%20interior&image_size=landscape_16_9',
        features: ['免费停车', '生鲜蔬菜', '日用品齐全', '24小时营业', '会员优惠'],
        reviews: [
          {
            user: '张三',
            rating: 5,
            content: '超市很大，东西很齐全，价格也实惠，推荐！',
            time: '2024-01-15'
          },
          {
            user: '李四',
            rating: 4,
            content: '服务态度很好，就是人有点多，结账需要排队。',
            time: '2024-01-10'
          }
        ]
      },
      {
        id: 2,
        name: '物美超市',
        address: '北京市朝阳区望京西路18号',
        hours: '08:30-21:30',
        distance: 800,
        phone: '010-87654321',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=supermarket%20interior&image_size=landscape_16_9',
        features: ['免费停车', '生鲜蔬菜', '日用品齐全', '会员优惠'],
        reviews: [
          {
            user: '王五',
            rating: 4,
            content: '价格合理，品种丰富，购物环境不错。',
            time: '2024-01-12'
          }
        ]
      },
      {
        id: 3,
        name: '家乐福',
        address: '北京市朝阳区三里屯路19号',
        hours: '09:00-22:00',
        distance: 1200,
        phone: '010-11223344',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grocery%20store%20interior&image_size=landscape_16_9',
        features: ['免费停车', '生鲜蔬菜', '日用品齐全', '进口商品', '会员优惠'],
        reviews: [
          {
            user: '赵六',
            rating: 5,
            content: '进口商品很多，环境整洁，服务态度好。',
            time: '2024-01-08'
          }
        ]
      }
    ];
    
    const supermarket = supermarkets.find(item => item.id == id) || supermarkets[0];
    this.setData({ supermarket });
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    try {
      let userInfo = wx.getStorageSync('userInfo');
      const userId = wx.getStorageSync('userId');
      const token = wx.getStorageSync('token');

      if (userInfo && typeof userInfo === 'string') {
        try {
          userInfo = JSON.parse(userInfo);
        } catch (e) {
          userInfo = null;
        }
      }

      const isLogin = !!userId && !!token && userInfo;
      
      this.setData({
        userInfo: isLogin ? userInfo : null
      });
    } catch (err) {
      console.error('获取用户信息失败详情：', err);
      this.setData({ userInfo: null });
    }
  },

  /**
   * 拨打电话
   */
  makeCall() {
    const phone = this.data.supermarket.phone;
    
    // 如果没有电话号码，提示用户输入
    if (!phone || phone === '') {
      wx.showModal({
        title: '提示',
        content: '该超市暂无联系电话，是否添加？',
        editable: true,
        placeholderText: '请输入电话号码',
        success: (res) => {
          if (res.confirm && res.content) {
            // 更新超市信息
            const supermarket = this.data.supermarket;
            supermarket.phone = res.content;
            this.setData({ supermarket });
            
            // 保存到本地存储
            this.updateSupermarketInfo(supermarket);
            
            wx.showToast({ title: '添加成功', icon: 'success' });
          }
        }
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.error('拨打电话失败：', err);
        wx.showToast({ title: '拨打电话失败', icon: 'none' });
      }
    });
  },

  /**
   * 更新超市信息到本地存储
   */
  updateSupermarketInfo(supermarket) {
    try {
      // 更新收藏列表中的超市信息
      let collectedSupermarkets = wx.getStorageSync('collectedSupermarkets') || [];
      const index = collectedSupermarkets.findIndex(item => item.id == supermarket.id);
      if (index !== -1) {
        collectedSupermarkets[index] = supermarket;
        wx.setStorageSync('collectedSupermarkets', collectedSupermarkets);
      }
    } catch (err) {
      console.error('更新超市信息失败:', err);
    }
  },

  /**
   * 打开地图
   */
  openMap() {
    wx.openLocation({
      latitude: 39.9042,
      longitude: 116.4074,
      name: this.data.supermarket.name,
      address: this.data.supermarket.address,
      scale: 18
    });
  },

  /**
   * 检查收藏状态（数据库接口）
   */
  checkCollectionStatus(id) {
    const app = getApp();
    
    if (!id || !this.pageUserId) {
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
        favType: 'supermarket',
        targetId: id
      },
      success: (res) => {
        console.log('收藏状态检查返回：', res);
        if ([200, 0].includes(res.data?.code)) {
          this.setData({ isCollected: Boolean(res.data.data) });
        }
      },
      fail: (err) => {
        console.error('检查收藏状态失败：', err);
        this.checkLocalCollectionStatus(id);
      }
    });
  },

  /**
   * 检查本地收藏状态
   */
  checkLocalCollectionStatus(id) {
    try {
      const collectedSupermarkets = wx.getStorageSync('collectedSupermarkets') || [];
      const isCollected = collectedSupermarkets.some(item => item.id == id);
      this.setData({ isCollected });
    } catch (err) {
      console.error('检查本地收藏状态失败:', err);
    }
  },

  /**
   * 切换收藏状态（数据库接口）
   */
  toggleCollect() {
    this.getLoginStateSync();
    console.log('收藏按钮点击 - 当前登录态：', this.pageUserId);

    if (!this.pageIsLogin || !this.pageUserId || !this.pageToken) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      const redirectUrl = encodeURIComponent(`/pages/用/supermarketDetail/supermarketDetail?id=${this.supermarketId}`);
      try {
        wx.navigateTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      } catch (err) {
        wx.redirectTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      }
      return;
    }

    const action = this.data.isCollected ? 'cancel' : 'add';
    const app = getApp();
    const supermarketId = this.supermarketId || this.data.supermarket.id;

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
        favType: 'supermarket',
        targetId: supermarketId
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
        this.toggleLocalCollect();
      }
    });
  },

  /**
   * 切换本地收藏状态
   */
  toggleLocalCollect() {
    const isCollected = !this.data.isCollected;
    const supermarket = this.data.supermarket;
    
    try {
      let collectedSupermarkets = wx.getStorageSync('collectedSupermarkets') || [];
      
      if (isCollected) {
        collectedSupermarkets.push(supermarket);
      } else {
        collectedSupermarkets = collectedSupermarkets.filter(item => item.id != supermarket.id);
      }
      
      wx.setStorageSync('collectedSupermarkets', collectedSupermarkets);
      this.setData({ isCollected });
      wx.showToast({
        title: isCollected ? '收藏成功' : '取消收藏',
        icon: 'success'
      });
    } catch (err) {
      console.error('操作本地收藏失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: this.data.supermarket.name,
      path: `/pages/用/supermarketDetail/supermarketDetail?id=${this.data.supermarket.id}`,
      success: () => {
        wx.showToast({ title: '分享成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '分享失败', icon: 'none' });
      }
    };
  },

  /**
   * 返回上一级页面
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({ url: '/pages/用/supermarketList/supermarketList' });
        }
      });
    } else {
      wx.redirectTo({ url: '/pages/用/supermarketList/supermarketList' });
    }
  }
});