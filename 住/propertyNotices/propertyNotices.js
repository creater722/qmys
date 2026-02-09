// 导入请求工具
import { get } from '../../../utils/request';

Page({
  data: {
    noticesList: [], // 公告列表数据
    pagination: {    // 分页信息
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    },
    isLoading: false, // 加载状态
    hasMore: true     // 是否还有更多数据
  },

  // 页面加载时获取公告
  onLoad() {
    this.getNoticesData();
  },

  // ========== 新增：返回按钮逻辑 ==========
  /**
   * 返回上一页（适配返回按钮点击）
   */
  goBack() {
    // 优先返回上一页
    wx.navigateBack({
      delta: 1, // 返回1级页面
      fail: () => {
        // 兜底：没有上一页时跳转到首页（替换为你的首页路径）
        wx.switchTab({
          url: '/pages/index/index' 
          // 如果不是tab页，用这个：wx.redirectTo({ url: '/pages/home/home' });
        });
      }
    });
  },

  // 下拉刷新（重新加载第一页）
  onPullDownRefresh() {
    this.setData({
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      hasMore: true
    }, () => {
      this.getNoticesData(true);
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.isLoading) return;
    this.setData({
      'pagination.page': this.data.pagination.page + 1
    }, () => {
      this.getNoticesData();
    });
  },

  // 调用后端接口获取公告（优化容错性）
  async getNoticesData(isRefresh = false) {
    const { pagination } = this.data;
    this.setData({ isLoading: true });

    try {
      // 调用后端物业公告接口
      const res = await get('/api/property/notices', {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      // ========== 优化：兼容后端返回格式 ==========
      // 处理后端返回的不同格式（防止接口返回结构不一致导致报错）
      const responseData = res || {};
      const list = responseData.data?.list || responseData.list || [];
      const paginationData = responseData.data?.pagination || responseData.pagination || {};

      // 处理分页数据
      const newList = isRefresh ? list : [...this.data.noticesList, ...list];
      this.setData({
        noticesList: newList,
        'pagination.total': paginationData.total || 0,
        'pagination.totalPages': paginationData.totalPages || Math.ceil((paginationData.total || 0) / pagination.pageSize),
        hasMore: pagination.page < (paginationData.totalPages || Math.ceil((paginationData.total || 0) / pagination.pageSize))
      });

    } catch (err) {
      console.error('获取公告失败：', err);
      // 友好提示用户
      wx.showToast({
        title: '获取公告失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoading: false });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  }
});