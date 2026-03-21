import { post } from '../../../../utils/request';

Page({
  data: {
    orderList: [],
    hasOrder: false,       // 是否有订单
    showEmpty: false,      // 显示空数据
    showLoading: false,    // 显示加载中
    showNoMore: false,     // 显示没有更多
    pageNum: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad() {
    // 延迟加载，避免小程序初始化时frame超时
    setTimeout(() => {
      this.loadOrders();
    }, 100);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      orderList: [],
      hasMore: true,
      showLoading: true
    }, () => {
      this.loadOrders(() => {
        wx.stopPullDownRefresh();
      });
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.showLoading) return;
    this.setData({
      pageNum: this.data.pageNum + 1,
      showLoading: true
    }, () => {
      this.loadOrders();
    });
  },

  // 加载订单（最终修复版：解决res未定义、图片500、userId匹配、toFixed类型错误）
  async loadOrders(callback) {
    if (this.data.showLoading && this.data.pageNum > 1) return;

    // ✅ 核心：确保全局App实例可用
    const app = getApp();
    // 登录校验
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('token');
    
    console.log('【订单列表】当前登录用户ID：', userId);
    console.log('【订单列表】全局基础地址：', app.getBaseUrl()); // 调试地址是否正确
    
    if (!token || !userId) { // ✅ 修复：同时校验token和userId
      wx.showToast({ title: '请先登录', icon: 'none' });
      this.setData({ showLoading: false });
      wx.navigateTo({ url: '/pages/login/login' });
      callback && callback();
      return;
    }

    try {
      // ✅ 核心：请求地址已由request.js拼接为服务器地址
      const res = await post('/api/user/orders/my', {
        userId: userId,
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      }, {
        header: { 'Authorization': 'Bearer ' + token }
      });

      console.log('【订单列表】后端返回数据：', res);

      // 处理响应
      let list = [];
      let total = 0;
      if (res && res.code == 200) {
        list = res.data.list || [];
        total = res.data.total || 0;
      }

      console.log('【订单列表】原始数据：', list);

      // 映射为单字母变量（规避解析器Bug）
      const formatList = list.map(item => {
        // 状态映射
        let statusClass = '';
        let statusText = '';
        let statusCode = item.order_status || 0;
        
        if (statusCode == 0) {
          statusClass = 'status-pending';
          statusText = '待支付';
        } else if (statusCode == 1) {
          statusClass = 'status-paid';
          statusText = '已支付';
        } else if (statusCode == 2) {
          statusClass = 'status-canceled';
          statusText = '已取消';
        } else if (statusCode == 3) {
          statusClass = 'status-completed';
          statusText = '已完成';
        } else {
          statusClass = 'status-canceled';
          statusText = '未知状态';
        }

        // 日期格式化（兼容后端返回的日期格式）
        const fmtDate = (str) => {
          if (!str) return '未设置'; // 空值显示“未设置”而非空
          try {
            const d = new Date(str);
            return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,0)}-${d.getDate().toString().padStart(2,0)}`;
          } catch (e) {
            return str; // 解析失败直接显示原始值
          }
        };
        const fmtTime = (str) => {
          if (!str) return '未设置';
          try {
            const d = new Date(str);
            return `${fmtDate(str)} ${d.getHours().toString().padStart(2,0)}:${d.getMinutes().toString().padStart(2,0)}`;
          } catch (e) {
            return str;
          }
        };

        // ✅ 核心修复：强制转换total_price为数字类型，避免toFixed报错
        const totalPrice = Number(item.total_price) || 0;

        // ✅ 优化：使用更稳定的占位图，解决图片加载错误
        const defaultCover = 'https://picsum.photos/100/75?random=1';

        return {
          a: item.order_no || '未知订单号',    // 订单号
          b: statusClass,                      // 状态样式
          c: statusText,                       // 状态文本
          d: item.hotel_cover || item.hotel?.coverImage || defaultCover, 
          e: item.hotel_name || item.hotel?.name || '未知酒店',     // 酒店名称
          f: item.room_type || '未知房型',      // 房型
          g: fmtDate(item.check_in_date),      // 入住日期
          h: fmtDate(item.check_out_date),     // 退房日期
          i: fmtTime(item.created_at),         // 创建时间
          j: '¥' + totalPrice.toFixed(2),      // 价格（修复toFixed错误）
          k: statusCode,                       // 状态码
          x: item.id,                          // 订单ID
          z: item.user_id || userId            // 用户ID
        };
      });

      // 合并数据
      const finalList = this.data.pageNum == 1 ? formatList : [...this.data.orderList, ...formatList];
      const hasMore = finalList.length < total;

      // 更新UI状态
      this.setData({
        orderList: finalList,
        hasMore: hasMore,
        hasOrder: finalList.length > 0,
        showEmpty: finalList.length == 0 && !this.data.showLoading,
        showLoading: false,
        showNoMore: !hasMore && finalList.length > 0
      });

      if (this.data.pageNum == 1 && finalList.length == 0) {
        wx.showToast({ title: '暂无订单', icon: 'none' });
      }

    } catch (err) {
      console.error('【订单列表】加载失败详情：', err);
      // ✅ 优化错误提示，区分服务器连接失败和接口错误
      const errMsg = err.errMsg || '服务器连接失败';
      wx.showToast({ title: errMsg.includes('connect') ? '服务器连接失败' : '加载订单失败', icon: 'none' });
      this.setData({ showLoading: false });
    } finally {
      callback && callback();
    }
  },

  // 跳转详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.x;
    wx.navigateTo({ url: `/pages/住/hotel_user/orderDetail/orderDetail?orderId=${id}` });
  },

  // 去支付
  toPay(e) {
    const id = e.currentTarget.dataset.x;
    const price = e.currentTarget.dataset.y;
    wx.showModal({
      title: '提示',
      content: `需支付 ${price}，是否前往支付？`,
      success(res) {
        if (res.confirm) {
          wx.navigateTo({ url: `/pages/住/hotel_user/pay/pay?orderId=${id}` });
        }
      }
    });
  },

  // 取消订单（修复刷新问题）
  cancelOrder(e) {
    const that = this; // 保存当前页面实例
    const id = e.currentTarget.dataset.x;
    const userId = e.currentTarget.dataset.z;
    const token = wx.getStorageSync('token');

    wx.showModal({
      title: '确认取消',
      content: '取消后无法恢复，确定吗？',
      async success(res) {
        if (res.confirm) {
          try {
            const cancelRes = await post('/api/user/orders/cancel', {
              orderId: id,
              userId: userId
            }, { header: { 'Authorization': 'Bearer ' + token } });

            if (cancelRes.code == 200) {
              wx.showToast({ title: '取消成功', icon: 'success' });
              // 刷新列表：重置页码并重新加载
              that.setData({
                pageNum: 1,
                orderList: [],
                hasMore: true
              }, () => {
                that.loadOrders();
              });
            } else {
              wx.showToast({ title: cancelRes.message || '取消失败', icon: 'none' });
            }
          } catch (err) {
            console.error('【订单列表】取消订单失败：', err);
            wx.showToast({ title: '服务器连接失败，取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 });
  }
});