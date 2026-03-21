// pages/住/hotel_user/addHotel/addHotel.js
Page({
  data: {
    // 酒店基础信息
    hotelName: '',
    address: '',
    coverImage: '',
    // 房型列表
    roomList: [
      { roomType: '', price: '' } // 默认1个房型
    ],
    // 提交按钮是否可用
    canSubmit: false
  },

  onLoad() {
    // 初始化检查提交状态
    this.checkSubmitStatus();
  },

  // 输入酒店名称
  onHotelNameInput(e) {
    this.setData({ hotelName: e.detail.value.trim() }); // 去除首尾空格
    this.checkSubmitStatus();
  },

  // 输入酒店地址
  onAddressInput(e) {
    this.setData({ address: e.detail.value.trim() }); // 去除首尾空格
    this.checkSubmitStatus();
  },

  // 输入封面图URL
  onCoverInput(e) {
    this.setData({ coverImage: e.detail.value.trim() }); // 去除首尾空格
    this.checkSubmitStatus();
  },

  // 输入房型名称
  onRoomTypeInput(e) {
    const index = e.currentTarget.dataset.index;
    const roomList = [...this.data.roomList]; // 深拷贝避免直接修改原数组
    roomList[index].roomType = e.detail.value.trim();
    this.setData({ roomList });
    this.checkSubmitStatus();
  },

  // 输入房型价格
  onRoomPriceInput(e) {
    const index = e.currentTarget.dataset.index;
    const roomList = [...this.data.roomList];
    // 限制价格为数字且大于0
    const price = e.detail.value.trim();
    if (price && Number(price) <= 0) {
      wx.showToast({ title: '价格需大于0', icon: 'none' });
      return;
    }
    roomList[index].price = price;
    this.setData({ roomList });
    this.checkSubmitStatus();
  },

  // 添加房型
  addRoom() {
    const roomList = [...this.data.roomList];
    // 限制最多添加5个房型（可根据需求调整）
    if (roomList.length >= 5) {
      wx.showToast({ title: '最多添加5个房型', icon: 'none' });
      return;
    }
    roomList.push({ roomType: '', price: '' });
    this.setData({ roomList });
  },

  // 删除房型
  deleteRoom(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.roomList.length <= 1) {
      wx.showToast({ title: '至少保留1个房型', icon: 'none' });
      return;
    }
    const roomList = [...this.data.roomList];
    roomList.splice(index, 1);
    this.setData({ roomList });
    this.checkSubmitStatus();
  },

  // 检查是否可以提交
  checkSubmitStatus() {
    const { hotelName, address, coverImage, roomList } = this.data;
    // 基础信息不能为空
    if (!hotelName || !address || !coverImage) {
      this.setData({ canSubmit: false });
      return;
    }
    // 所有房型的名称和价格都不能为空，且价格为有效数字
    const allRoomValid = roomList.every(room => {
      return room.roomType && room.price && Number(room.price) > 0;
    });
    this.setData({ canSubmit: allRoomValid });
  },

  // 提交酒店信息
  submitHotel() {
    // ✅ 核心修复1：获取全局 app 实例
    const app = getApp();
    
    // 二次校验（防止前端绕过禁用状态）
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请完善所有信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true }); // 添加遮罩防止重复点击

    // 构造提交数据
    const submitData = {
      hotelName: this.data.hotelName,
      address: this.data.address,
      coverImage: this.data.coverImage,
      roomList: this.data.roomList.map(room => ({
        roomType: room.roomType,
        price: Number(room.price)
      }))
    };

    // 调用后端接口
    wx.request({
      // ✅ 核心修复2：替换为服务器地址（使用全局 baseUrl）
      url: `${app.getBaseUrl()}/api/hotels/add`,
      method: 'POST',
      timeout: 10000, // ✅ 优化：增加超时时间
      header: {
        'content-type': 'application/json' // 明确请求头
      },
      data: submitData,
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '添加成功！', icon: 'success', duration: 1500 });
          // 重置表单（延迟重置，让用户看到成功提示）
          setTimeout(() => {
            this.setData({
              hotelName: '',
              address: '',
              coverImage: '',
              roomList: [{ roomType: '', price: '' }]
            });
          }, 1500);
        } else {
          wx.showToast({ title: res.data?.message || '添加失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交失败：', err);
        wx.showToast({ title: '服务器连接失败，请检查网络', icon: 'none' });
      }
    });
  },

  // 替换原有 goBack 方法
  goBack() {
    // 先尝试返回上一页
    const pages = getCurrentPages(); // 获取当前页面栈
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: (err) => {
          console.error('返回上一页失败：', err);
          // 兜底：直接跳转到个人中心
          wx.redirectTo({
            url: '/pages/住/hotel_user/personalCenter/personalCenter'
          });
        }
      });
    } else {
      // 页面栈只有当前页，直接跳转回个人中心
      wx.redirectTo({
        url: '/pages/住/hotel_user/personalCenter/personalCenter'
      });
    }
  }
});