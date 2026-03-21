Page({
  data:{
    theme:'light',
    userInfo:{avatarUrl:'/assets/avatar-default.png',nickName:'点击登录'},
    vipLevel:0, vipDays:0,
    // privilegeList:[
    //   {id:1, name:'免广告', icon:'icon-ad', url:'/pages/vip/ad'},
    //   {id:2, name:'加速下载', icon:'icon-download', url:'/pages/vip/download'},
    //   {id:3, name:'专属模板', icon:'icon-template', url:'/pages/vip/template'},
    //   {id:4, name:'云端备份', icon:'icon-cloud', url:'/pages/vip/backup'}
    // ],
    toolList:[
      {id:1, name:'收藏', icon:'icon-star', url:'/pages/收藏/收藏'},
      {id:2, name:'喜欢', icon:'icon-heart', url:'/pages/喜欢/喜欢'},
      {id:3, name:'历史', icon:'icon-history', url:'/pages/history/index'},
      {id:4, name:'下载', icon:'icon-download', url:'/pages/download/index'},
      {id:5, name:'评价', icon:'icon-rate', url:'/pages/rate/index'},
      {id:6, name:'地址', icon:'icon-location', url:'/pages/address/index'},
      {id:7, name:'帮助', icon:'icon-help', url:'/pages/help/index'},
      {id:8, name:'反馈', icon:'icon-feedback', url:'/pages/feedback/index'},
      {id:9, name:'更多', icon:'icon-more', url:'/pages/more/index'}
    ],
    orderTabs:[
      {name:'全部', count:0},
      {name:'待付款', count:2},
      {name:'待发货', count:1},
      {name:'待收货', count:3},
      {name:'退款', count:0}
    ],
    walletList:[
      {name:'余额', num:'0.00', type:'balance'},
      {name:'优惠券', num:5, type:'coupon'},
      {name:'积分', num:1200, type:'point'},
      {name:'红包', num:3, type:'redpack'}
    ],
    creatorOpened:false, creatorTxt:'开通后可享创作激励', yesterdayIncome:'0.00'
  },
  onLoad(){
    this.loadTheme();
    this.getUserInfo();
    this.getVip();
    this.getCreator();
  },
  loadTheme(){
    const idx=wx.getStorageSync('themeIndex')||0;
    const map=['light','dark','auto'];
    let theme=map[idx];
    if(theme==='auto') theme=wx.getSystemInfoSync().theme==='dark'?'dark':'light';
    this.setData({theme});
  },
  getUserInfo(){
    // 实际业务：先检查登录态
    const app=getApp();
    if(app.globalData.userInfo){
      this.setData({userInfo:app.globalData.userInfo});
    }else{
      // 未登录展示默认
    }
  },
  getVip(){
    wx.request({
      url:'https://your.api/vip/info',
      header:{Authorization:wx.getStorageSync('token')},
      success:res=>{
        if(res.data.code===0){
          const d=res.data.data;
          this.setData({
            vipLevel:d.level,
            vipDays:d.remainDays
          });
        }
      }
    });
  },
  getCreator(){
    wx.request({
      url:'https://your.api/creator/info',
      header:{Authorization:wx.getStorageSync('token')},
      success:res=>{
        if(res.data.code===0){
          const d=res.data.data;
          this.setData({
            creatorOpened:d.joined,
            creatorTxt:d.joined?'已开通创作激励':'开通后可享创作激励',
            yesterdayIncome:d.yesterdayIncome
          });
        }
      }
    });
  },
  goProfile(){ wx.navigateTo({url:'/pages/profile/index'}); },
  showQR(){ wx.navigateTo({url:'/pages/qr/index'}); },
  renewVip(){ wx.navigateTo({url:'/pages/vip/renew'}); },
  goVipPage(e){ const id=e.currentTarget.dataset.id; wx.navigateTo({url:`/pages/vip/detail?id=${id}`}); },
  toolTap(e){ const url=e.currentTarget.dataset.url; wx.navigateTo({url}); },
  goOrder(e){ const tab=e.currentTarget.dataset.tab; wx.navigateTo({url:`/pages/order/index?tab=${tab}`}); },
  walletTap(e){
    const t=e.currentTarget.dataset.type;
    wx.navigateTo({url:`/pages/wallet/index?type=${t}`});
  },
  openCreator(){
    wx.navigateTo({url:'/pages/creator/join'});
  },
  goCreator(){
    wx.navigateTo({url:'/pages/creator/home'});
  },
  goAbout(){ wx.navigateTo({url:'/pages/about/index'}); },
  goSettings(){ wx.navigateTo({url:'/pages/setting/setting'}); },
  openCustomer(){
    wx.openCustomerServiceConversation({});
  }
});
