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
    hasMore: true,    // 是否还有更多数据
    
    // ========== 新增：伪TabBar核心配置 ==========
    activeTab: 'notice', // 默认选中「物业公告」Tab
    // Tab路径映射（根据你项目的实际页面路径调整）
    tabPathMap: {
      notice: '/pages/property/notice/notice',      // 物业公告（当前页）
      pay: '/pages/property/payWaterElectric/payWaterElectric' // 交水电页
      //mine: '/pages/property/mine/mine'             // 我的页（物业相关）
    }
  },

  // 页面加载时获取公告
  onLoad() {
    // 调试：打印全局基础地址，确认request.js配置生效
    const app = getApp();
    console.log('【物业公告页】全局基础地址：', app.getBaseUrl());
    this.getNoticesData();
  },

  // ========== 原有：返回按钮逻辑（优化） ==========
  /**
   * 返回上一页（适配返回按钮点击）
   */
  goBack() {
    const pages = getCurrentPages();
    // 优先返回上一页
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          // 兜底：跳转首页
          wx.switchTab({ url: '/pages/index/index' });
        }
      });
    } else {
      // 页面栈只有当前页，直接跳首页
      wx.switchTab({ url: '/pages/index/index' });
    }
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

  // 调用后端接口获取公告（优化容错性+数据格式化）
  async getNoticesData(isRefresh = false) {
    const { pagination } = this.data;
    this.setData({ isLoading: true });

    try {
      console.log('【物业公告】请求参数：', {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      // 调用后端物业公告接口（地址由request.js自动拼接服务器地址）
      const res = await get('/api/property/notices', {
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      // ========== 优化：兼容后端返回格式 + 数据格式化 ==========
      const responseData = res || {};
      const list = responseData.data?.list || responseData.list || [];
      const paginationData = responseData.data?.pagination || responseData.pagination || {};

      // 数据格式化：给所有字段加默认值，避免前端渲染报错
      const formatList = list.map(item => ({
        id: item.id || '',
        title: item.title || '无标题公告',
        content: item.content || '暂无公告内容',
        publishTime: item.publishTime || item.publish_time || new Date().toLocaleDateString(),
        publisher: item.publisher || '物业管理员',
        status: item.status || 'published',
        createTime: item.createTime || item.create_time || ''
      }));

      // 处理分页数据
      const newList = isRefresh ? formatList : [...this.data.noticesList, ...formatList];
      const total = paginationData.total || 0;
      const totalPages = paginationData.totalPages || Math.ceil(total / pagination.pageSize);

      this.setData({
        noticesList: newList,
        'pagination.total': total,
        'pagination.totalPages': totalPages,
        hasMore: pagination.page < totalPages
      });

      // 无数据提示
      if (isRefresh && newList.length === 0) {
        wx.showToast({ title: '暂无物业公告', icon: 'none', duration: 2000 });
      }

    } catch (err) {
      console.error('获取公告失败详情：', err);
      // 区分错误类型，友好提示
      const errMsg = err.errMsg || '服务器连接失败';
      wx.showToast({
        title: errMsg.includes('connect') ? '服务器连接失败' : '获取公告失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoading: false });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  },

  // ========== 新增：伪TabBar切换核心方法（优化） ==========
  /**
   * TabBar切换逻辑
   * @param {Object} e - 点击事件对象
   */
  switchTab(e) {
    // 1. 获取点击的Tab标识
    const tabKey = e.currentTarget.dataset.tab;
    if (tabKey === this.data.activeTab) return;

    // 2. 更新选中态
    this.setData({ activeTab: tabKey });

    // 3. 获取目标页面路径
    const targetUrl = this.data.tabPathMap[tabKey];
    if (!targetUrl) {
      wx.showToast({ title: '页面路径配置错误', icon: 'none' });
      this.setData({ activeTab: 'notice' });
      return;
    }

    // 4. 分场景处理跳转逻辑
    try {
      if (tabKey === 'notice') {
        // 当前页：刷新公告列表
        this.onPullDownRefresh();
        wx.showToast({ title: '已刷新公告列表', icon: 'none', duration: 1000 });
      } else {
        // 其他页：跳转对应页面
        wx.navigateTo({
          url: targetUrl,
          fail: (err) => {
            console.error('Tab跳转失败：', err);
            // 区分跳转失败类型
            if (err.errMsg.includes('page not found')) {
              wx.showToast({ title: '该页面尚未开发', icon: 'none' });
            } else {
              wx.showToast({ title: '页面跳转失败', icon: 'none' });
            }
            this.setData({ activeTab: 'notice' });
          }
        });
      }
    } catch (err) {
      console.error('Tab切换异常：', err);
      wx.showToast({ title: '切换失败，请重试', icon: 'none' });
      this.setData({ activeTab: 'notice' });
    }
  },

  /**
   * 点击公告条目（新增：跳转到公告详情页）
   */
  goToNoticeDetail(e) {
    const noticeId = e.currentTarget.dataset.id;
    if (!noticeId) {
      wx.showToast({ title: '公告ID异常', icon: 'none' });
      return;
    }
    try {
      wx.navigateTo({
        url: `/pages/property/noticeDetail/noticeDetail?id=${noticeId}`
      });
    } catch (err) {
      console.error('跳转公告详情失败：', err);
      wx.showToast({ title: '暂无公告详情', icon: 'none' });
    }
  }
});