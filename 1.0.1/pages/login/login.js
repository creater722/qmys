// Crypto简易加密
const Crypto = {
    SECRET_KEY: 'WeChatMiniProgram2024SecureKey',
    
    encrypt(text) {
      if (!text) return '';
      try {
        const key = this.SECRET_KEY;
        let result = '';
        for (let i = 0; i < text.length; i++) {
          const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          result += String.fromCharCode(charCode);
        }
        const base64 = wx.arrayBufferToBase64(new Uint8Array([...result].map(c => c.charCodeAt(0))).buffer);
        return base64;
      } catch (e) {
        console.error('加密失败:', e);
        return text;
      }
    },
    
    decrypt(base64Str) {
      if (!base64Str) return '';
      try {
        const key = this.SECRET_KEY;
        const arrayBuffer = wx.base64ToArrayBuffer(base64Str);
        const bytes = new Uint8Array(arrayBuffer);
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
          const charCode = bytes[i] ^ key.charCodeAt(i % key.length);
          result += String.fromCharCode(charCode);
        }
        return result;
      } catch (e) {
        console.error('解密失败:', e);
        return base64Str;
      }
    }
  };
  
  Page({
    data: {
      loginType: 'wechat',// 默认微信登录
      phoneNumber: '',//手机号
      verifyCode: '',//验证码
      countDown: 0,//验证码倒计时
      isPhoneValid: false,//手机号是否合法
      isAgree: false,//是否同意协议
      showAgreementModal: false,//是否显示协议弹窗
      isLoginLoading: false,
      mockCode: '',
      systemInfo: null,
      safeArea: null
    },
    //onLoad生命周期  
    onLoad() {
      //获取系统信息，用于各设备适配
      this.getSystemInfo();
      
      const encryptedToken = wx.getStorageSync('token_encrypted');
      if (encryptedToken) {
        const token = Crypto.decrypt(encryptedToken);
        console.log('解密后的token:', token);
      }
    },
  
    //获取系统信息方法
    getSystemInfo() {
      try {
        const systemInfo = wx.getSystemInfoSync();
        console.log('系统信息:', systemInfo);
        
        this.setData({
          systemInfo: systemInfo,
          safeArea: systemInfo.safeArea || null
        });
        
        //据设备类型调整
        this.adjustUIForDevice(systemInfo);
      } catch (e) {
        console.error('获取系统信息失败:', e);
      }
    },
  
    // 根据设备调整
    adjustUIForDevice(systemInfo) {
      // 判断是否为平板或大屏设备
      const isTablet = systemInfo.screenWidth > 768;
      // 判断是否为PC端
      const isPC = systemInfo.platform === 'windows' || systemInfo.platform === 'mac';
      
      if (isTablet || isPC) {
        console.log('大屏设备适配');
      }
    },
  
    //切换登录方式
    switchLoginType(e) {
      const type = e.currentTarget.dataset.type;
      if (type === this.data.loginType) return; // 防止重复点击
      
      this.setData({
        loginType: type,
        phoneNumber: '',
        verifyCode: '',
        countDown: 0,
        isPhoneValid: false,
        mockCode: ''
      });
    },
    //切换协议同意状态
    toggleAgreement() {
      this.setData({
        isAgree: !this.data.isAgree
      });
    },
    //登录前检查
    preLoginCheck() {
      if (this.data.isAgree) {
        this.onWechatLogin();
      } else {
        this.setData({
          showAgreementModal: true
        });
      }
    },
    //关闭协议弹窗
    closeAgreementModal() {
      this.setData({
        showAgreementModal: false
      });
    },
    //确认同意协议并登录
    confirmAgreement() {
      this.setData({
        isAgree: true,
        showAgreementModal: false
      }, () => {
        this.onWechatLogin();
      });
    },
    //打开协议页面
    openAgreement(e) {
      const type = e.currentTarget.dataset.type;
      wx.navigateTo({
        url: `/pages/agreement/agreement?type=${type}`
      });
    },
    preventTouchMove() {
      return false;
    },
    //手机号输入处理
    onPhoneInput(e) {
      const phone = e.detail.value.trim();
      //验证手机号格式(11位数字，以1开头) 
      const reg = /^1[3-9]\d{9}$/;
      const isValid = reg.test(phone) && phone.length === 11;
      
      this.setData({
        phoneNumber: phone,
        isPhoneValid: isValid
      });
    },
    //验证码输入处理
    onCodeInput(e) {
      this.setData({
        verifyCode: e.detail.value.trim()
      });
    },
  
    //获取验证码
    getVerifyCode() {
      if (!this.data.isPhoneValid) {
        wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
        return;
      }
      
      if (this.data.countDown > 0) return; // 防止重复点击
      
      wx.showLoading({ title: '发送中...', mask: true });
      this.mockSendCode();
    },
  
    mockSendCode() {
      setTimeout(() => {
        wx.hideLoading();
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        this.setData({ mockCode: mockCode });
        
        //在开发环境显示验证码(仅在开发时用于调试)
        if (wx.getAccountInfoSync().miniProgram.envVersion === 'develop') {
          wx.showToast({ 
            title: `验证码：${mockCode}`, 
            icon: 'none',
            duration: 3000
          });
        } else {
          wx.showToast({ 
            title: '验证码已发送', 
            icon: 'success',
            duration: 2000
          });
        }
        
        this.startCountDown();
      }, 500);
    },
    //验证码倒计时
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

      this.countDownTimer = timer;
    },
  
    // 微信登录
    onWechatLogin() {
      //防止重复点击
      if (this.data.isLoginLoading) return;
      
      this.setData({ isLoginLoading: true });
      wx.showLoading({ title: '登录中...', mask: true });
  
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (profileRes) => {
          const userInfo = profileRes.userInfo;
          
          wx.login({
            success: (loginRes) => {
              if (!loginRes.code) {
                wx.hideLoading();
                this.setData({ isLoginLoading: false });
                wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
                return;
              }
              setTimeout(() => {
                this.handleLoginSuccess(userInfo, 'wechat');
              }, 800);
            },
            fail: (err) => {
              wx.hideLoading();
              this.setData({ isLoginLoading: false });
              console.error('wx.login 失败:', err);
              wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
            }
          });
        },
        fail: (err) => {
          wx.hideLoading();
          this.setData({ isLoginLoading: false });
          console.error('getUserProfile 失败:', err);
          
          // 区分用户拒绝和其他错误
          if (err.errMsg && err.errMsg.includes('deny')) {
            wx.showToast({ title: '您拒绝了授权', icon: 'none' });
          } else {
            wx.showToast({ title: '获取用户信息失败', icon: 'none' });
          }
        }
      });
    },
  
    // 统一处理登录成功逻辑
    handleLoginSuccess(userInfo, loginType) {
      wx.hideLoading();
      
      const token = `${loginType}_token_${Date.now()}`;
      
      // 加密存储敏感信息
      wx.setStorageSync('token_encrypted', Crypto.encrypt(token));
      wx.setStorageSync('userInfo_encrypted', Crypto.encrypt(JSON.stringify(userInfo)));
      // 明文存储（便于调试，生产环境可移除）
      wx.setStorageSync('token', token);
      wx.setStorageSync('userInfo', userInfo);
  
      // 更新全局状态
      const app = getApp();
      if (app) {
        app.globalData.isLogin = true;
        app.globalData.token = token;
        app.globalData.userInfo = userInfo;
      }
  
      this.setData({ isLoginLoading: false });
  
      // 登录成功跳转
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            this.navigateToHome();
          }, 1500);
        }
      });
    },
  
    //统一跳转首页方法
    navigateToHome() {
        wx.reLaunch({
          url: '/pages/index/index'
        });
    },
  
    //手机号登录
    onPhoneLogin() {
      const { phoneNumber, verifyCode, mockCode } = this.data;
      //表单检验
      if (!this.data.isPhoneValid) {
        wx.showToast({ title: '请输入正确手机号', icon: 'none' });
        return;
      }
      if (!verifyCode) {
        wx.showToast({ title: '请输入验证码', icon: 'none' });
        return;
      }
      
      // 验证码验证
      if (verifyCode !== mockCode && wx.getAccountInfoSync().miniProgram.envVersion !== 'develop') {
        wx.showToast({ title: '验证码错误', icon: 'none' });
        return;
      }
  
      wx.showLoading({ title: '登录中...', mask: true });
  
      setTimeout(() => {
        const userInfo = { 
          phone: phoneNumber,
          nickName: `用户${phoneNumber.slice(-4)}`,
          loginType: 'phone'
        };
        
        this.handleLoginSuccess(userInfo, 'phone');
      }, 800);
    },
  
    onUnload() {
      //清理定时器
      if (this.countDownTimer) {
        clearInterval(this.countDownTimer);
      }
    }
  });