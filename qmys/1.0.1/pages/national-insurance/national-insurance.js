// pages/national-insurance/national-insurance.js
Page({

  data: {
    url: '',  // web-view 地址
    loadError: false,
    loading: true,
    errorMsg: ''
  },

  onLoad(options) {
    // 多个官方医保网站备选
    const insuranceUrls = [
      'https://fuwu.nhsa.gov.cn',          // 国家医保服务平台（推荐）
      'https://www.nhsa.gov.cn',           // 国家医保局官网
      'https://www.gov.cn/fuwu/ylbx.htm',  // 中国政府网医保服务
      'https://zwfw.fujian.gov.cn/',       // 政务服务网（备选）
      'https://gjzwfw.www.gov.cn/'         // 国家政务服务平台
    ];
    
    this.setData({
      url: insuranceUrls[0], // 使用第一个
      loading: true
    });
  },

  onReady() {},

  onShow() {},

  // web-view 加载完成
  onWebViewLoad(e) {
    console.log('web-view加载完成', e);
    this.setData({
      loading: false
    });
  },

  // web-view 加载失败
  onWebViewError(e) {
    console.error('web-view加载失败', e);
    const errorDetail = e.detail || {};
    
    this.setData({
      loadError: true,
      loading: false,
      errorMsg: this.getErrorMessage(errorDetail)
    });
    
    // 记录错误信息
    wx.reportAnalytics('webview_error', {
      url: this.data.url,
      errCode: errorDetail.errCode || 'unknown'
    });
  },

  // 获取错误信息
  getErrorMessage(detail) {
    const errCode = detail.errCode;
    const errMsgs = {
      1: '网络错误，请检查网络连接',
      2: 'SSL证书错误，网站可能存在安全问题',
      3: '服务器连接失败',
      4: '请求超时',
      5: '域名未授权，请联系管理员',
      6: '系统错误'
    };
    
    return errMsgs[errCode] || '页面加载失败，请稍后重试';
  },

  // 重新加载
  reloadPage() {
    this.setData({
      loadError: false,
      loading: true
    });
    
    // 延迟重新加载
    setTimeout(() => {
      this.setData({
        url: this.data.url + '?t=' + Date.now() // 添加时间戳避免缓存
      });
    }, 300);
  },

  // 使用备选网址
  useAlternativeUrl() {
    const alternativeUrls = [
      'https://www.nhsa.gov.cn',
      'https://www.gov.cn/fuwu/ylbx.htm',
      'https://gjzwfw.www.gov.cn/'
    ];
    
    // 随机选择一个备选
    const randomIndex = Math.floor(Math.random() * alternativeUrls.length);
    const newUrl = alternativeUrls[randomIndex];
    
    this.setData({
      url: newUrl,
      loadError: false,
      loading: true
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 复制链接
  copyUrl() {
    wx.setClipboardData({
      data: this.data.url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  // 在浏览器中打开
  openInBrowser() {
    wx.showModal({
      title: '提示',
      content: '将在浏览器中打开医保官网',
      success: (res) => {
        if (res.confirm) {
          // 复制链接并提示用户
          wx.setClipboardData({
            data: this.data.url,
            success: () => {
              wx.showModal({
                title: '操作指引',
                content: '链接已复制到剪贴板\n请在浏览器中粘贴打开',
                showCancel: false,
                confirmText: '知道了'
              });
            }
          });
        }
      }
    });
  }
});