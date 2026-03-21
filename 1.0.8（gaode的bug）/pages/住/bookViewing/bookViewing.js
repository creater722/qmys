import { post } from '../../../utils/request';

Page({
  data: {
    houseId: '',
    houseTitle: '',
    bookForm: {
      name: '',
      phone: '',
      date: '',
      remark: ''
    },
    isSubmitting: false
  },

  onLoad(options) {
    // 获取房源ID和标题
    this.setData({
      houseId: options.houseId || '',
      houseTitle: options.houseTitle || ''
    });
    // 自动填充用户信息
    this.fillUserInfo();
  },

  // 自动填充用户信息
  fillUserInfo() {
    const name = wx.getStorageSync('userName') || '';
    const phone = wx.getStorageSync('phone') || '';
    if (name) this.setData({ 'bookForm.name': name });
    if (phone) this.setData({ 'bookForm.phone': phone });
  },

  // 输入框变化
  onInputChange(e) {
    const { key } = e.currentTarget.dataset;
    let value = e.detail.value.trim();
    // 手机号仅保留数字
    if (key === 'phone') {
      value = value.replace(/\D/g, '').substring(0, 11);
    }
    this.setData({ [`bookForm.${key}`]: value });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ 'bookForm.date': e.detail.value });
  },

  // 提交预约
  async submitBook() {
    const { houseId, bookForm } = this.data;
    const userId = wx.getStorageSync('userId');
    
    // 校验登录
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    // 表单校验
    if (!bookForm.name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!bookForm.phone || !/^1[3-9]\d{9}$/.test(bookForm.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!bookForm.date) {
      wx.showToast({ title: '请选择预约日期', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    try {
      const token = wx.getStorageSync('token') || '';
      const res = await post('/api/rentals/book', {
        userId,
        houseId,
        name: bookForm.name,
        phone: bookForm.phone,
        bookDate: bookForm.date,
        remark: bookForm.remark
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        wx.showToast({ title: '预约成功', icon: 'success' });
        // 预约成功后返回上一页
        setTimeout(() => {
          this.goBack();
        }, 1500);
      } else {
        wx.showToast({ title: res.message || '预约失败', icon: 'none' });
      }
    } catch (err) {
      console.error('提交预约失败：', err);
      wx.showToast({ title: '服务器连接失败', icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({ url: `/pages/住//rentDetail?houseId=${this.data.houseId}` });
      }
    });
  }
});