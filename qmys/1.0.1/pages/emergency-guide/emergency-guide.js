// pages/emergency-guide/emergency-guide.js
Page({

  data: {
    guideList: [
      {
        icon: '🚨',
        title: '拨打急救电话',
        desc: '立即拨打120急救电话，说明情况、地址和联系方式'
      },
      {
        icon: '📍',
        title: '查找最近急诊',
        desc: '使用地图查找附近医院急诊科，确保尽快到达'
      },
      {
        icon: '📞',
        title: '联系家人/朋友',
        desc: '通知家人或朋友协助前往医院，准备医保卡和身份证'
      },
      {
        icon: '🏥',
        title: '到达急诊',
        desc: '到达后向分诊台说明病情，配合医生检查与治疗'
      }
    ],
    emergencyContacts: [
      { name: '急救电话', number: '120', color: '#FF5252' },
      { name: '报警电话', number: '110', color: '#4CAF50' },
      { name: '火警电话', number: '119', color: '#FF9800' }
    ]
  },

  onLoad(options) {},

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      success: () => {
        console.log('返回成功');
      },
      fail: (err) => {
        console.error('返回失败', err);
        // 如果返回失败，跳转到主页
        wx.switchTab({
          url: '/pages/医/医'
        });
      }
    });
  },

  // 返回首页
  goHome() {
    wx.switchTab({
      url: '/pages/医/医'
    });
  },

  // 拨打电话
  makeCall(e) {
    const number = e.currentTarget.dataset.number;
    wx.makePhoneCall({
      phoneNumber: number,
      success: () => {
        console.log('拨打电话成功');
      }
    });
  },

  // 复制号码
  copyNumber(e) {
    const number = e.currentTarget.dataset.number;
    wx.setClipboardData({
      data: number,
      success: () => {
        wx.showToast({
          title: '号码已复制',
          icon: 'success'
        });
      }
    });
  }
});