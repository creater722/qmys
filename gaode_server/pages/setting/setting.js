Page({
  data:{
    theme:'light', themeIndex:0, themeOptions:['浅色','深色','跟随系统'],
    langIndex:0, langOptions:['简体中文','English'],
    cacheSize:'0 B',
    alertOn:true, freqIndex:0, freqOptions:['实时','每小时','每天'],
    creatorStatus:'unopen', creatorStatusTxt:'未开通',
    worksCount:0, yesterdayPlay:0, income:0,
    version:'1.0.0'
  },
  onLoad(){
    this.loadSettings();
    this.getCreatorStats();
  },
  loadSettings(){
    const s=wx.getStorageSync('userSettings')||{};
    this.setData({
      themeIndex:s.themeIndex||0,
      langIndex:s.langIndex||0,
      alertOn:s.alertOn!==undefined?s.alertOn:true,
      freqIndex:s.freqIndex||0
    });
    this.applyTheme();
    this.calcCache();
  },
  applyTheme(){
    const map=['light','dark','auto'];
    let theme=map[this.data.themeIndex];
    if(theme==='auto') theme=wx.getSystemInfoSync().theme==='dark'?'dark':'light';
    this.setData({theme});
    wx.setNavigationBarColor({
      frontColor:theme==='dark'?'#ffffff':'#000000',
      backgroundColor:theme==='dark'?'#0d0d0d':'#ffffff'
    });
  },
  calcCache(){
    wx.getStorageInfo({
      success:r=>{
        const size=r.currentSize*1024;
        const units=['B','KB','MB'];
        let i=0;
        while(size>1024&&i<2){ size/=1024; i++; }
        this.setData({cacheSize:size.toFixed(1)+' '+units[i]});
      }
    });
  },
  clearCache(){
    wx.showModal({
      title:'清理缓存',
      content:'确定清除本地缓存？',
      success:res=>{
        if(res.confirm){
          wx.clearStorage({
            success:()=>{
              wx.showToast({title:'清理成功',icon:'none'});
              this.calcCache();
            }
          });
        }
      }
    });
  },
  toggleAlert(e){
    const alertOn=e.detail.value;
    this.setData({alertOn});
    this.save({alertOn});
  },
  changeTheme(){
    const arr=['浅色','深色','跟随系统'];
    wx.showActionSheet({itemList:arr,success:res=>{
      const idx=res.tapIndex;
      this.setData({themeIndex:idx});
      this.save({themeIndex:idx});
      this.applyTheme();
    }});
  },
  changeLang(){
    wx.showActionSheet({
      itemList:this.data.langOptions,
      success:res=>{
        const idx=res.tapIndex;
        this.setData({langIndex:idx});
        this.save({langIndex:idx});
        wx.showToast({title:'重启后生效',icon:'none'});
      }
    });
  },
  changeFreq(){
    wx.showActionSheet({
      itemList:this.data.freqOptions,
      success:res=>{
        const idx=res.tapIndex;
        this.setData({freqIndex:idx});
        this.save({freqIndex:idx});
      }
    });
  },
  openCreator(){
    // 调用后端开通接口
    wx.request({
      url:'https://your.api/creator/join',
      method:'POST',
      header:{Authorization:wx.getStorageSync('token')},
      success:res=>{
        if(res.data.code===0){
          this.setData({
            creatorStatus:'opened',
            creatorStatusTxt:'已开通'
          });
          this.getCreatorStats();
          wx.showToast({title:'开通成功',icon:'success'});
        }
      }
    });
  },
  goWithdraw(){
    wx.navigateTo({url:'/pages/withdraw/index'});
  },
  getCreatorStats(){
    // 读创作数据
    wx.request({
      url:'https://your.api/creator/stats',
      header:{Authorization:wx.getStorageSync('token')},
      success:res=>{
        if(res.data.code===0){
          const d=res.data.data;
          this.setData({
            worksCount:d.worksCount,
            yesterdayPlay:d.yesterdayPlay,
            income:d.income,
            creatorStatus:d.joined?'opened':'unopen',
            creatorStatusTxt:d.joined?'已开通':'未开通'
          });
        }
      }
    });
  },
  save(obj){
    const s=wx.getStorageSync('userSettings')||{};
    Object.assign(s,obj);
    wx.setStorageSync('userSettings',s);
  }
});