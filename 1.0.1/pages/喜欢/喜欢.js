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

  onLoad(options) {
    this.getLikeList();
  },

  onShow() {
    this.getLikeList();
  },

  // 获取喜欢列表（完整接口）
  getLikeList() {
    this.setData({ loading: true });
    wx.request({
      url: "https://你的域名/api/user/like/list",
      method: "GET",
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      },
      header: {
        token: wx.getStorageSync("token")
      },
      success: (res) => {
        if (res.data.code === 200) {
          let list = res.data.data.list || [];
          this.setData({
            likeList: this.data.pageNum === 1 ? list : [...this.data.likeList, ...list],
            hasMore: res.data.data.hasMore || false
          });
        } else {
          wx.showToast({ title: res.data.msg || "获取失败", icon: "none" });
        }
      },
      fail: () => {
        wx.showToast({ title: "网络异常", icon: "none" });
      },
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
  onPullDownRefresh() {
    if (this.data.isRefreshing) return;
    this.setData({ isRefreshing: true, pageNum: 1 });
    this.getLikeList();
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ pageNum: this.data.pageNum + 1 });
    this.getLikeList();
  },

  // 取消喜欢（真删除数据库）
  deleteLike(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: "取消中..." });

    wx.request({
      url: "https://你的域名/api/user/like/delete",
      method: "POST",
      data: { id },
      header: {
        token: wx.getStorageSync("token")
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 删除后刷新列表
          this.setData({
            likeList: this.data.likeList.filter(i => i.id !== id)
          });
          wx.showToast({ title: "已取消喜欢", icon: "success" });
        } else {
          wx.showToast({ title: res.data.msg || "取消失败", icon: "none" });
        }
      },
      fail: () => {
        wx.showToast({ title: "网络异常", icon: "none" });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 跳转详情页
  goDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (!item.id) return wx.showToast({ title: "数据异常", icon: "none" });

    const detailPathMap = {
      restaurant: "/pages/restaurant/detail",
      hotel: "/pages/hotel/detail",
      hospital: "/pages/hospital/detail",
      route: "/pages/route/detail",
      supermarket: "/pages/supermarket/detail"
    };

    const targetPath = detailPathMap[item.type] || "/pages/common/detail";
    wx.navigateTo({
      url: `${targetPath}?id=${item.id}&title=${item.title}`
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
