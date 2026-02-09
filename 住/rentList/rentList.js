import { get } from '../../../utils/request';

Page({
  data: {
    rentalList: [],
    pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    isLoading: true,
    hasMore: true
  },

  onLoad() {
    this.getRentalList(true);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      hasMore: true
    }, () => {
      this.getRentalList(true);
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.isLoading) return;
    this.setData({
      'pagination.page': this.data.pagination.page + 1
    }, () => {
      this.getRentalList(false);
    });
  },

  async getRentalList(isRefresh = false) {
    this.setData({ isLoading: true });
    try {
      const { pagination } = this.data;
      const res = await get('/api/rentals/list', {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      if (res.code === 200) {
        const newList = isRefresh
          ? res.data.list
          : [...this.data.rentalList, ...res.data.list];

        this.setData({
          rentalList: newList,
          'pagination.total': res.data.pagination.total,
          'pagination.totalPages': res.data.pagination.totalPages,
          hasMore: pagination.page < res.data.pagination.totalPages
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  },

  // 跳转到详情页
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/住/rentalDetail/rentalDetail?id=${id}`
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});