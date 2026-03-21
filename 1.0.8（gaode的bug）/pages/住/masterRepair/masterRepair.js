import { get, post } from '../../../utils/request';

Page({
  data: {
    allOrders: [],        // 所有用户的工单列表
    isLoading: false,     // 加载状态
    status: 'all',        // 筛选状态：all/submitted/processing/completed
    statusOptions: [      // 状态筛选选项
      { text: '全部工单', value: 'all' },
      { text: '待处理', value: 'submitted' },
      { text: '处理中', value: 'processing' },
      { text: '已完成', value: 'completed' }
    ]
  },

  onLoad(options) {
    // 加载所有工单
    this.getAllOrders();
  },

  onShow() {
    // 页面显示时刷新工单
    this.getAllOrders();
  },

  /**
   * 获取所有用户的维修工单（师傅视角）
   * 核心修改：不传userId，调用现有接口 /api/repair/orders 查所有工单
   */
  async getAllOrders() {
    this.setData({ isLoading: true });
    try {
      const token = wx.getStorageSync('token') || '';
      // 构造查询参数（带状态筛选，不传userId）
      const params = {
        page: 1,
        pageSize: 20
      };
      // 非全部状态时，添加status筛选
      if (this.data.status !== 'all') {
        params.status = this.data.status;
      }

      // 调用后端已有的 /api/repair/orders 接口（无需新增接口）
      const res = await get('/api/repair/orders', params, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        this.setData({
          allOrders: res.data?.list || []
        });
      } else {
        wx.showToast({ title: res?.message || '查询工单失败', icon: 'none' });
      }
    } catch (err) {
      console.error('查询所有工单失败：', err);
      wx.showToast({ title: '服务器连接失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 状态筛选变更
   */
  onStatusChange(e) {
    this.setData({
      status: e.detail
    }, () => {
      // 筛选后重新加载工单
      this.getAllOrders();
    });
  },

  /**
   * 工单状态文本映射
   */
  getStatusText(status) {
    const statusMap = {
      submitted: '待处理',
      processing: '处理中',
      completed: '已完成',
      canceled: '已取消'
    };
    return statusMap[status] || '待处理';
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          this.redirectToRepair();
        }
      });
    } else {
      this.redirectToRepair();
    }
  },

  /**
   * 兜底跳转：回到维修报修页
   */
  redirectToRepair() {
    wx.redirectTo({
      url: '/pages/住/repairOrder/repairOrder',
      fail: () => {
        wx.showToast({ title: '返回失败', icon: 'none' });
        wx.switchTab({ url: '/pages/住/住' }); // 兜底到住模块首页
      }
    });
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  /**
   * 开始处理工单
   */
  async processOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    if (!orderId) return;

    try {
      const token = wx.getStorageSync('token') || '';
      const res = await post(`/api/repair/orders/${orderId}/process`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        wx.showToast({ title: '工单已开始处理', icon: 'success' });
        this.getAllOrders(); // 刷新列表
      } else {
        wx.showToast({ title: res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('处理工单失败：', err);
      wx.showToast({ title: '服务器连接失败', icon: 'none' });
    }
  },

  /**
   * 完成工单
   */
  async completeOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    if (!orderId) return;

    wx.showModal({
      title: '确认完成',
      content: '是否确认该工单已完成？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = wx.getStorageSync('token') || '';
            const res = await post(`/api/repair/orders/${orderId}/complete`, {}, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res?.code === 200) {
              wx.showToast({ title: '工单已完成', icon: 'success' });
              this.getAllOrders(); // 刷新列表
            } else {
              wx.showToast({ title: res?.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            console.error('完成工单失败：', err);
            wx.showToast({ title: '服务器连接失败', icon: 'none' });
          }
        }
      }
    });
  }
});