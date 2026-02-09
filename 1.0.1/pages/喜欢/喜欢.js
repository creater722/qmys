Page({
  data: {
    theme: '',
    loading: false,
    isRefreshing: false,
    hasMore: false,
    likeList: [],
    pageNum: 1,
    pageSize: 10
  },

  // 页面加载初始化
  onLoad(options) {
    this.getLikeList();
  },

  // 获取全量喜欢列表
  getLikeList() {
    this.setData({ loading: true });
    wx.request({
      url: 'https://你的域名/api/user/like/list', // 替换为真实列表接口
      method: 'GET',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      },
      header: { 'token': wx.getStorageSync('token') },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            likeList: res.data.data.list,
            hasMore: res.data.data.hasMore
          });
        } else {
          wx.showToast({ title: res.data.msg || '获取失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络异常', icon: 'none' }),
      complete: () => {
        this.setData({ loading: false });
        if (this.data.isRefreshing) {
          this.setData({ isRefreshing: false });
          wx.stopPullDownRefresh();
        }
      }
    });
  },

  // 下拉刷新
  onRefresh() {
    if (this.data.isRefreshing) return;
    this.setData({ isRefreshing: true, pageNum: 1 });
    this.getLikeList();
  },

  // 跳转多类型详情页
  goDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (!item.id) return wx.showToast({ title: '数据异常', icon: 'none' });
    
    // 多详情页路径映射（替换为你的真实路径）
    const detailPathMap = {
      restaurant: '/pages/restaurant/detail',
      hotel: '/pages/hotel/detail',
      hospital: '/pages/hospital/detail',
      route: '/pages/route/detail',
      supermarket: '/pages/supermarket/detail'
    };
    
    // 匹配对应详情页，默认跳转到通用详情页
    const targetPath = detailPathMap[item.type] || '/pages/common/detail';
    wx.navigateTo({
      url: `${targetPath}?id=${item.id}&title=${item.title}`
    });
  },

  // 取消喜欢
  delLike(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '取消中...' });
    wx.request({
      url: 'https://你的域名/api/user/like/delete', // 替换为真实取消接口
      method: 'POST',
      data: { id: id },
      header: { 'token': wx.getStorageSync('token') },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({ likeList: this.data.likeList.filter(i => i.id !== id) });
          wx.showToast({ title: '已取消喜欢', icon: 'success' });
        } else {
          wx.showToast({ title: res.data.msg || '取消失败', icon: 'none' });
        }
      },
      fail: () => wx.showToast({ title: '网络异常', icon: 'none' }),
      complete: () => wx.hideLoading()
    });
  },

  // 上拉加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ loading: true, pageNum: this.data.pageNum + 1 });
    this.getLikeList();
  }
});
