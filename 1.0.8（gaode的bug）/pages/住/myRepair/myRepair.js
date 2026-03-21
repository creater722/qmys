import { get, post } from '../../../utils/request';

Page({
  data: {
    myOrders: [],       // 我的工单列表
    isLoading: false,   // 加载状态
    userId: ''          // 当前用户ID
  },

  onLoad(options) {
    // 获取当前登录用户ID
    this.setData({
      userId: wx.getStorageSync('userId') || 22 // 兜底用测试ID
    });
    // 加载我的工单
    this.getMyOrders();
  },

  onShow() {
    // 页面显示时刷新工单
    this.getMyOrders();
  },

  /**
   * 获取我的维修工单（仅当前账号提交的）
   */
  async getMyOrders() {
    this.setData({ isLoading: true });
    try {
      const token = wx.getStorageSync('token') || '';
      const res = await get('/api/repair/orders', {
        page: 1,
        pageSize: 20,
        userId: this.data.userId // 传userId查当前用户工单
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        this.setData({
          myOrders: res.data?.list || []
        });
      } else {
        wx.showToast({ title: res?.message || '查询工单失败', icon: 'none' });
      }
    } catch (err) {
      console.error('查询我的工单失败：', err);
      wx.showToast({ title: '服务器连接失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
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

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  /**
   * 取消工单
   */
  async cancelOrder(e) {
    const orderId = e.currentTarget.dataset.orderid;
    if (!orderId) return;

    wx.showModal({
      title: '确认取消',
      content: '是否确认取消该工单？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = wx.getStorageSync('token') || '';
            const res = await post(`/api/repair/orders/${orderId}/cancel`, {
              userId: this.data.userId
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res?.code === 200) {
              wx.showToast({ title: '工单已取消', icon: 'success' });
              this.getMyOrders(); // 刷新列表
            } else {
              wx.showToast({ title: res?.message || '取消失败', icon: 'none' });
            }
          } catch (err) {
            console.error('取消工单失败：', err);
            wx.showToast({ title: '服务器连接失败', icon: 'none' });
          }
        }
      }
    });
  },

  /**
   * 跳转到维修报修页
   */
  goRepair() {
    wx.navigateTo({
      url: '/pages/住/repairOrder/repairOrder'
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({ url: '/pages/住/repairOrder/repairOrder' });
      }
    });
  }
});