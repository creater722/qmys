import { get, post } from '../../../utils/request';

Page({
  data: {
    collectList: [],
    isLoading: true
  },

  onLoad() {
    this.getCollectList();
  },

  onShow() {
    this.getCollectList(); // 页面显示时刷新
  },

  // 获取收藏列表
  async getCollectList() {
    this.setData({ isLoading: true });
    try {
      const userId = wx.getStorageSync('userId');
      const token = wx.getStorageSync('token') || '';
      if (!userId) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        wx.navigateTo({ url: '/pages/login/login' });
        this.setData({ isLoading: false });
        return;
      }

      const res = await get('/api/user/favorites/list', {
        userId,
        favType: 'rental',
        page: 1,
        pageSize: 20
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        this.setData({ collectList: res.data.list || [] });
      } else {
        wx.showToast({ title: res.message || '获取收藏列表失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取收藏列表失败：', err);
      wx.showToast({ title: '服务器连接失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 取消收藏
  async uncollectHouse(e) {
    const houseId = e.currentTarget.dataset.houseid;
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    wx.showModal({
      title: '确认取消',
      content: '是否取消收藏该房源？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = wx.getStorageSync('token') || '';
            const res = await post('/api/user/favorites/remove', {
              userId,
              favType: 'rental',
              targetId: houseId
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res?.code === 200) {
              wx.showToast({ title: '取消收藏成功', icon: 'success' });
              this.getCollectList(); // 刷新列表
            } else {
              wx.showToast({ title: res.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            console.error('取消收藏失败：', err);
            wx.showToast({ title: '服务器连接失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 跳转到房源详情
  goDetail(e) {
    const houseId = e.currentTarget.dataset.houseid;
    wx.navigateTo({
      url: `/pages/住/rentDetail/rentDetail?houseId=${houseId}`
    });
  },

  // 去房源列表
  goRentList() {
    wx.navigateTo({ url: '/pages/住/rentList/rentList' });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({ url: '/pages/住/rentList/rentList' });
      }
    });
  }
});