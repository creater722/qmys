import { get, post } from '../../../../utils/request';

Page({
  data: {
    hotelId: '',
    roomId: '',
    hotel: {},
    room: {},
    checkIn: '',
    checkOut: '',
    contactName: '',
    contactPhone: '',
    guestCount: 1,
    remark: '',
    minDate: new Date().getTime(),
    maxDate: new Date(new Date().getFullYear() + 1, 11, 31).getTime()
  },

  // 页面变量存储登录态
  pageUserId: '',
  pageToken: '',
  pageIsLogin: false,

  onLoad(options) {
    const { hotelId, roomId } = options;
    if (!hotelId || !roomId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ hotelId, roomId });
    this.getLoginStateSync();
    this.loadRoomDetail(hotelId, roomId);
    // 默认选中今天和明天
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.setData({
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0]
    });
  },

  /**
   * 同步获取登录态
   */
  getLoginStateSync() {
    try {
      const localUserId = wx.getStorageSync('userId') || '';
      const localIsLogin = wx.getStorageSync('isLogin') === true || wx.getStorageSync('isLogin') === 'true';
      const localToken = wx.getStorageSync('token') || '';

      const app = getApp();
      const globalUserId = app.globalData.userId || '';
      const globalIsLogin = app.globalData.isLogin || false;
      const globalToken = app.globalData.token || '';

      this.pageUserId = String(localUserId || globalUserId).trim() || '';
      this.pageToken = String(localToken || globalToken).trim() || '';
      this.pageIsLogin = localIsLogin || globalIsLogin;

      // 新增：打印全局基础地址，确认request.js配置生效
      console.log('【订单确认页】全局基础地址：', app.getBaseUrl());
      console.log('【登录态】', {
        pageUserId: this.pageUserId,
        pageToken: this.pageToken,
        pageIsLogin: this.pageIsLogin
      });
    } catch (err) {
      console.error('读取登录态失败：', err);
      this.pageUserId = '';
      this.pageToken = '';
      this.pageIsLogin = false;
    }
  },

  /**
   * 加载房型详情（从酒店详情接口筛选房型，避免调用不存在的接口）
   */
  async loadRoomDetail(hotelId, roomId) {
    wx.showLoading({ title: '加载中' });
    try {
      // ✅ 此时get请求已由request.js拼接为服务器地址：http://47.107.255.111:3001/api/hotels/${hotelId}
      const hotelRes = await get(`/api/hotels/${hotelId}`);
      console.log('【酒店详情接口返回】', hotelRes);
      
      if (hotelRes.code === 200) {
        const hotel = hotelRes.data;
        // 从酒店的 rooms 数组中筛选对应房型
        const room = hotel.rooms?.find(item => item.id == roomId) || {};
        this.setData({
          room: {
            id: room.id || '',
            roomType: room.roomType || room.room_type || '', // 兼容两种字段名：roomType/room_type
            price: room.price || 0,
            area: room.area || '',
            bedCount: room.bedCount || 1
          },
          hotel: {
            id: hotel.id || '',
            name: hotel.name || '',
            address: hotel.address || ''
          }
        });
        console.log('【前端获取的房型信息】', this.data.room);
      } else {
        wx.showToast({ title: hotelRes.message || '加载房型失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载房型失败：', err);
      // ✅ 优化错误提示，区分服务器连接失败
      const errMsg = err.errMsg || '服务器连接失败';
      wx.showToast({ title: errMsg.includes('connect') ? '服务器连接失败' : '加载房型失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 选择入住日期
   */
  bindCheckInChange(e) {
    const checkIn = e.detail.value;
    // 确保退房日期晚于入住日期
    if (checkIn >= this.data.checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      this.setData({
        checkIn,
        checkOut: checkOutDate.toISOString().split('T')[0]
      });
    } else {
      this.setData({ checkIn });
    }
  },

  /**
   * 选择退房日期
   */
  bindCheckOutChange(e) {
    const checkOut = e.detail.value;
    if (checkOut <= this.data.checkIn) {
      wx.showToast({ title: '退房日期必须晚于入住日期', icon: 'none' });
      return;
    }
    this.setData({ checkOut });
  },

  /**
   * 输入联系人姓名
   */
  inputName(e) {
    this.setData({ contactName: e.detail.value });
  },

  /**
   * 输入联系人电话
   */
  inputPhone(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  /**
   * 调整入住人数
   */
  adjustGuestCount(e) {
    const { type } = e.currentTarget.dataset;
    let { guestCount } = this.data;
    if (type === 'minus' && guestCount > 1) {
      guestCount--;
    } else if (type === 'plus') {
      guestCount++;
    }
    this.setData({ guestCount });
  },

  /**
   * 输入备注
   */
  inputRemark(e) {
    this.setData({ remark: e.detail.value });
  },

  /**
   * 提交订单（最终优化版：新增roomType字段，确保后端能获取真实房型名称）
   */
  async submitOrder() {
    // 防止重复提交
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    // 1. 校验登录态
    this.getLoginStateSync();
    if (!this.pageIsLogin || !this.pageUserId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      const redirectUrl = encodeURIComponent(`/pages/住/hotel_user/orderConfirm/orderConfirm?hotelId=${this.data.hotelId}&roomId=${this.data.roomId}`);
      wx.navigateTo({ url: `/pages/login/login?redirect=${redirectUrl}` });
      this.setData({ submitting: false });
      return;
    }

    // 2. 校验表单
    const { contactName, contactPhone, checkIn, checkOut, room, hotelId, roomId } = this.data;
    if (!contactName) {
      wx.showToast({ title: '请输入联系人姓名', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }
    if (!contactPhone || !/^1[3-9]\d{9}$/.test(contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }
    if (!checkIn || !checkOut) {
      wx.showToast({ title: '请选择入住/退房日期', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }

    // 3. 计算总价（后端大概率需要这个字段，避免500错误）
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = days * (room.price || 100); // 兜底默认100元/晚

    // 4. 构造完整订单参数（核心新增：roomType字段）
    const orderParams = {
      userId: this.pageUserId,
      hotelId: hotelId,
      roomId: parseInt(roomId, 10) || 0, 
      roomType: room.roomType || '默认房型', // 新增：直接传递前端已获取的真实房型名称
      checkIn: checkIn,
      checkOut: checkOut,
      contactName: contactName,
      contactPhone: contactPhone,
      guestCount: this.data.guestCount,
      remark: this.data.remark || '',
      totalPrice: totalPrice,
      orderTime: new Date().toISOString()
    };

    // 关键：打印请求参数（定位500错误的核心）
    console.log('【提交订单参数】', orderParams);
    console.log('【请求头】', {
      'Authorization': `Bearer ${this.pageToken}`,
      'Content-Type': 'application/json'
    });

    // 5. 提交订单
    wx.showLoading({ title: '提交中' });
    try {
      // ✅ 此时post请求已由request.js拼接为服务器地址：http://47.107.255.111:3001/api/user/orders/create
      const res = await post('/api/user/orders/create', orderParams, {
        header: {
          'Authorization': `Bearer ${this.pageToken}`,
          'Content-Type': 'application/json'
        }
      });

      // 打印后端完整返回
      console.log('【后端返回结果】', res);

      if (res.code === 200) {
        wx.showToast({ title: '订单创建成功', icon: 'success' });
        // 跳转到我的订单
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/住/hotel_user/orderList/orderList` });
        }, 1500);
      } else {
        // 后端返回非200的错误提示
        wx.showToast({ title: res.message || '创建订单失败', icon: 'none', duration: 2000 });
      }
    } catch (err) {
      // 捕获500错误，增加重试逻辑
      console.error('【提交订单失败详情】', err);
      wx.hideLoading(); // 先隐藏加载框
      
      // 区分错误类型，友好提示
      const errMsg = err?.data?.message || (err.errMsg?.includes('connect') ? '服务器连接失败' : '服务器繁忙，请稍后重试');
      wx.showModal({
        title: '提交失败',
        content: errMsg,
        confirmText: '重试',
        cancelText: '返回',
        success: (res) => {
          this.setData({ submitting: false });
          if (res.confirm) {
            this.submitOrder(); // 重试提交
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
});