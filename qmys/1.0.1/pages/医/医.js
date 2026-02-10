// pages/医/医.js

Page({

  data: {},

  onLoad(options) {},

  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {},

  handleTap(e) {
    const key = e.currentTarget.dataset.key;
    const map = {
      hospital: '附近医院',
      register: '预约挂号',
      emergency: '急诊指南',
      insurance: '医保查询'
    };

    if (key === 'hospital') {
      this.openWeChatMap();
    } else if (key === 'register') {
      // 跳转到微医小程序
      this.openWeDoctor();
    } else if (key === 'emergency') {
      // 跳转到急诊指南页面
      this.openEmergencyGuide();
    } else if (key === 'insurance') {
      // 医保查询 - 使用web-view打开国家医保官网
      this.openNationalInsuranceWeb();
    } else {
      wx.showToast({
        title: `${map[key] || '功能'}待接入`,
        icon: 'none',
        duration: 1500
      });
    }
  },

  // 跳转到微医小程序
  openWeDoctor() {
    wx.navigateToMiniProgram({
      appId: 'wxbd687630cd02ce1d', // 请替换为微医小程序的实际 AppId
      path: '', // 可选：微医小程序内页面路径
      success(res) {
        console.log('打开微医小程序成功');
      },
      fail(err) {
        console.error('打开微医小程序失败', err);
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 跳转到急诊指南页面
  openEmergencyGuide() {
    wx.navigateTo({
      url: '/pages/emergency-guide/emergency-guide'
    });
  },

  // 使用web-view打开国家医保官网
  openNationalInsuranceWeb() {
    // 跳转到web-view页面
    wx.navigateTo({
      url: '/pages/national-insurance/national-insurance'
    });
  },

  // 打开微信内置地图
  openWeChatMap() {
    this.checkSystemPermission();
  },

  // 检查系统定位权限
  checkSystemPermission() {
    wx.getSystemInfo({
      success: (res) => {
        this.checkLocationService();
      },
      fail: () => {
        this.tryOpenMap();
      }
    });
  },

  // 检查定位服务
  checkLocationService() {
    wx.getLocation({
      type: 'wgs84',
      success: () => {
        this.openMapPicker();
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          this.showPermissionModal();
        } else if (err.errMsg.includes('system permission')) {
          this.showSystemPermissionGuide();
        } else {
          this.openMapWithDefaultLocation();
        }
      }
    });
  },

  // 打开地图选择器
  openMapPicker() {
    wx.chooseLocation({
      success: (res) => {
        this.showLocationInfo(res);
      },
      fail: (err) => {
        this.handleMapError(err);
      }
    });
  },

  // 显示位置信息
  showLocationInfo(res) {
    wx.showModal({
      title: '位置选择成功',
      content: `📍 ${res.name || '未知地点'}\n📌 ${res.address || '地址不详'}`,
      showCancel: false,
      confirmText: '好的'
    });
  },

  // 处理地图错误
  handleMapError(err) {
    const errMsg = err.errMsg || '';

    if (errMsg.includes('cancel')) {
      console.log('用户取消选择');
    } else if (errMsg.includes('auth deny') || errMsg.includes('permission')) {
      this.showPermissionModal();
    } else {
      wx.showToast({
        title: '地图加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 显示权限提示
  showPermissionModal() {
    wx.showModal({
      title: '需要位置权限',
      content: '查找附近医院需要使用您的位置信息\n\n请授权位置权限',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
                setTimeout(() => {
                  this.openWeChatMap();
                }, 500);
              }
            }
          });
        }
      }
    });
  },

  // 显示系统权限引导
  showSystemPermissionGuide() {
    wx.showModal({
      title: '请开启定位服务',
      content: '请在手机设置中开启定位服务\n\n设置 → 隐私 → 定位服务 → 开启',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 备用方案：使用默认位置
  openMapWithDefaultLocation() {
    wx.openLocation({
      latitude: 39.9042,
      longitude: 116.4074,
      scale: 15,
      name: '北京协和医院',
      address: '北京市东城区帅府园1号',
      success: () => {},
      fail: (err) => {
        wx.showToast({
          title: '无法打开地图',
          icon: 'none'
        });
      }
    });
  },

  // 直接尝试打开
  tryOpenMap() {
    wx.chooseLocation({
      success: (res) => {
        this.showLocationInfo(res);
      },
      fail: (err) => {
        this.openMapWithDefaultLocation();
      }
    });
  }

});