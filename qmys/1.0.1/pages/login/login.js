// pages/login/login.js
Page({
  data: {
    loginType: 'wechat', // 默认微信登录
    phoneNumber: '',     // 手机号
    verifyCode: '',      // 验证码
    countDown: 0,        // 验证码倒计时
    isPhoneValid: false  // 手机号是否合法
  },

  // 切换登录方式
  switchLoginType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      loginType: type,
      // 切换时清空表单
      phoneNumber: '',
      verifyCode: '',
      countDown: 0,
      isPhoneValid: false
    });
  },

  // 手机号输入处理
  onPhoneInput(e) {
    const phone = e.detail.value.trim();
    // 验证手机号格式（11位数字，以1开头）
    const reg = /^1[3-9]\d{9}$/;
    this.setData({
      phoneNumber: phone,
      isPhoneValid: reg.test(phone)
    });
  },

  // 验证码输入处理
  onCodeInput(e) {
    this.setData({
      verifyCode: e.detail.value.trim()
    });
  },

  // 获取验证码
  getVerifyCode() {
    const { phoneNumber } = this.data;
    // 再次校验手机号（防止前端校验被绕过）
    if (!this.data.isPhoneValid) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    // 模拟验证码发送（测试阶段可先注释真实请求，用模拟代替）
    wx.showToast({
      title: '验证码已发送（测试）',
      icon: 'success'
    });
    this.startCountDown();

    // 真实项目请替换为你的后端API（记得配置合法域名）
    // wx.request({
    //   url: 'https://your-api-domain.com/api/send-code',
    //   method: 'POST',
    //   data: {
    //     phone: phoneNumber
    //   },
    //   success: (res) => {
    //     if (res.data.code === 200) {
    //       wx.showToast({
    //         title: '验证码已发送',
    //         icon: 'success'
    //       });
    //       this.startCountDown();
    //     } else {
    //       wx.showToast({
    //         title: res.data.msg || '发送失败',
    //         icon: 'none'
    //       });
    //     }
    //   },
    //   fail: () => {
    //     wx.showToast({
    //       title: '网络异常，请重试',
    //       icon: 'none'
    //     });
    //   }
    // });
  },

  // 验证码倒计时
  startCountDown() {
    let count = 60;
    this.setData({ countDown: count });
    const timer = setInterval(() => {
      count--;
      this.setData({ countDown: count });
      if (count <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  },

  // 微信登录（简化：固定跳 index 首页）
  onWechatLogin(e) {
    const { userInfo } = e.detail;
    if (!userInfo) {
      wx.showToast({
        title: '请授权后再登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
      mask: true // 遮罩层，防止重复点击
    });

    // 1. 获取微信登录凭证code
    wx.login({
      success: (loginRes) => {
        // 测试阶段：跳过真实接口请求，直接模拟登录成功
        wx.hideLoading();
        // 存储模拟的token（真实项目替换为后端返回的token）
        wx.setStorageSync('token', 'test_token_' + Date.now());
        wx.setStorageSync('userInfo', userInfo);
        
        // 更新全局登录状态
        const app = getApp();
        app.globalData.isLogin = true;
        app.globalData.token = wx.getStorageSync('token');

        // 固定跳转到 index 首页（核心修改）
        wx.switchTab({
          url: '/pages/index/index'
        });
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 真实项目请替换为以下接口请求逻辑
        // wx.request({
        //   url: 'https://your-api-domain.com/api/wechat-login',
        //   method: 'POST',
        //   data: {
        //     code: loginRes.code,
        //     userInfo: userInfo
        //   },
        //   success: (res) => {
        //     if (res.data.code === 200) {
        //       // 存储登录态
        //       wx.setStorageSync('token', res.data.data.token);
        //       wx.setStorageSync('userInfo', res.data.data.userInfo);
              
        //       // 更新全局登录状态
        //       app.globalData.isLogin = true;
        //       app.globalData.token = res.data.data.token;

        //       // 固定跳 index 首页
        //       wx.switchTab({
        //         url: '/pages/index/index'
        //       });
        //       wx.showToast({
        //         title: '登录成功',
        //         icon: 'success'
        //       });
        //     } else {
        //       wx.showToast({
        //         title: res.data.msg || '登录失败',
        //         icon: 'none'
        //       });
        //     }
        //   },
        //   fail: () => {
        //     wx.showToast({ title: '网络异常', icon: 'none' });
        //   },
        //   complete: () => {
        //     wx.hideLoading();
        //   }
        // });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '获取登录凭证失败',
          icon: 'none'
        });
      }
    });
  },

  // 手机号登录（简化：固定跳 index 首页）
  onPhoneLogin() {
    const { phoneNumber, verifyCode } = this.data;
    // 表单校验
    if (!this.data.isPhoneValid) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (!verifyCode) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...', mask: true });

    // 测试阶段：跳过真实接口，模拟登录成功
    wx.hideLoading();
    wx.setStorageSync('token', 'phone_token_' + Date.now());
    wx.setStorageSync('userInfo', { phone: phoneNumber });
    
    const app = getApp();
    app.globalData.isLogin = true;
    app.globalData.token = wx.getStorageSync('token');

    // 固定跳 index 首页
    wx.reLaunch({
      url: '/pages/index/index'
    });
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });

    // 真实项目请替换为以下接口请求逻辑
    // wx.request({
    //   url: 'https://your-api-domain.com/api/phone-login',
    //   method: 'POST',
    //   data: { phone: phoneNumber, code: verifyCode },
    //   success: (res) => {
    //     if (res.data.code === 200) {
    //       // 存储登录态
    //       wx.setStorageSync('token', res.data.data.token);
    //       wx.setStorageSync('userInfo', res.data.data.userInfo);
          
    //       // 更新全局登录状态
    //       app.globalData.isLogin = true;
    //       app.globalData.token = res.data.data.token;

    //       // 固定跳 index 首页
    //       wx.switchTab({
    //         url: '/pages/index/index'
    //       });
    //       wx.showToast({ title: '登录成功', icon: 'success' });
    //     } else {
    //       wx.showToast({ title: res.data.msg || '验证码错误', icon: 'none' });
    //     }
    //   },
    //   fail: () => {
    //     wx.showToast({ title: '网络异常', icon: 'none' });
    //   },
    //   complete: () => {
    //     wx.hideLoading();
    //   }
    // });
  },

  onUnload() {
    const app = getApp();
    if (!app.globalData.isLogin) {
      // 未登录时点击返回，直接退出小程序
      wx.exitMiniProgram();
    }
  }
});