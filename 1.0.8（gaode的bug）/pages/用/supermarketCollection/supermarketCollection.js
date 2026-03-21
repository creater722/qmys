Page({
  /**
   * 页面的初始数据
   */
  data: {
    collectionList: [],
    isLoading: true
  },
  pageUserId: '',
  pageToken: '',
  pageIsLogin: false,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getLoginStateSync();
    this.loadCollectionList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getLoginStateSync();
    this.loadCollectionList();
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
   * 加载收藏的超市列表（数据库接口）
   */
  loadCollectionList() {
    this.setData({ isLoading: true });
    const app = getApp();
    
    if (this.pageUserId && this.pageToken) {
      wx.request({
        url: `${app.getBaseUrl()}/api/user/favorites/list`,
        method: 'GET',
        timeout: 10000,
        header: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.pageToken}`
        },
        data: {
          userId: this.pageUserId,
          favType: 'supermarket'
        },
        success: (res) => {
          console.log('收藏列表接口返回：', res);
          if (res.data?.code === 200 && res.data.data) {
            const collectionList = res.data.data.map(item => ({
              id: item.targetId || item.id,
              name: item.name || '未知超市',
              address: item.address || '暂无地址',
              distance: item.distance || 0,
              latitude: item.latitude || 0,
              longitude: item.longitude || 0,
              image: item.image || '/分类logo/超市.png'
            }));
            
            this.setData({
              collectionList: collectionList,
              isLoading: false
            });
          } else {
            this.loadLocalCollectionList();
          }
        },
        fail: (err) => {
          console.error('收藏列表请求失败：', err);
          this.loadLocalCollectionList();
        }
      });
    } else {
      this.loadLocalCollectionList();
    }
  },

  /**
   * 加载本地收藏列表
   */
  loadLocalCollectionList() {
    try {
      const collectedSupermarkets = wx.getStorageSync('collectedSupermarkets') || [];
      this.setData({
        collectionList: collectedSupermarkets,
        isLoading: false
      });
    } catch (err) {
      console.error('加载本地收藏列表失败:', err);
      this.setData({ 
        collectionList: [],
        isLoading: false 
      });
    }
  },

  /**
   * 跳转到超市详情页
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const supermarket = this.data.collectionList.find(item => item.id === id);
    
    if (supermarket) {
      wx.navigateTo({
        url: `/pages/用/supermarketDetail/supermarketDetail?id=${id}&name=${encodeURIComponent(supermarket.name)}&address=${encodeURIComponent(supermarket.address)}&latitude=${supermarket.latitude}&longitude=${supermarket.longitude}&distance=${supermarket.distance}`
      });
    }
  },

  /**
   * 移除收藏（数据库接口）
   */
  removeCollection(e) {
    const id = e.currentTarget.dataset.id;
    
    if (this.pageUserId && this.pageToken) {
      const app = getApp();
      
      wx.request({
        url: `${app.getBaseUrl()}/api/user/favorites/cancel`,
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
          console.log('取消收藏接口返回：', res);
          if ([200, 0].includes(res.data?.code)) {
            this.loadCollectionList();
            wx.showToast({ title: '已取消收藏', icon: 'success' });
          } else {
            wx.showToast({ title: res.data?.message || '操作失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('取消收藏请求失败：', err);
          this.removeLocalCollection(id);
        }
      });
    } else {
      this.removeLocalCollection(id);
    }
  },

  /**
   * 移除本地收藏
   */
  removeLocalCollection(id) {
    try {
      let collectedSupermarkets = wx.getStorageSync('collectedSupermarkets') || [];
      collectedSupermarkets = collectedSupermarkets.filter(item => item.id != id);
      wx.setStorageSync('collectedSupermarkets', collectedSupermarkets);
      
      this.setData({
        collectionList: collectedSupermarkets
      });
      
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } catch (err) {
      console.error('移除本地收藏失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  /**
   * 跳转到超市列表页面
   */
  goToSupermarketList() {
    wx.navigateTo({
      url: '/pages/用/supermarketList/supermarketList'
    });
  },

  /**
   * 图片加载失败处理
   */
  imageError(e) {
    console.log('图片加载失败:', e);
    const index = e.currentTarget.dataset.index;
    const collectionList = [...this.data.collectionList];
    // 设置默认超市图标
    collectionList[index].image = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=supermarket%20icon%20shopping%20cart%20simple&image_size=square_hd';
    this.setData({ collectionList });
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