// components/GaodeInputTips/GaodeInputTips.js
Component({
  properties: {
    city: {
      type: String,
      value: ''
    },
    longitude: {
      type: String,
      value: ''
    },
    latitude: {
      type: String,
      value: ''
    },
    inputType: {
      type: String,
      value: ''
    },
    defaultValue: {
      type: String,
      value: '请输入'
    },
  },
  data: {
    tips: {},
    tipsShow: false
  },
  lifetimes: {
    attached: function(){
      //在组件实例进入页面节点树时执行
    },
    ready: function(e){
      //在组件布局完成后执行
      console.log('搜索框',e)
    },
    detached: function(){
      //在组件实例被从页面节点树移除时执行
    }
  },
  methods: {
    bindInput: function(e){
      console.log('输入内容',e)
      var that = this;
      var keywords = e.detail.value;
      var gaode_key = require('../../../libs/config')
      var amapFile = require('../../../libs/amap-wx.130')
      const lonlat = `${that.properties.longitude},${that.properties.latitude}`;
      const city = that.properties.city;
      if(keywords===''){
        that.setData({
          tips: []
        });
        return false
      }
      var key = config.config.key;
      var maAmapFun = new amapFile.AMapWX({key:key});
      console.log(keywords,lonlat,city)
      maAmapFun,getInputtips({
        keywords: keywords,
        location: lonlat,
        city: city,
        success: function(data){
          if(data && data.tips){
            that.setData({
              tips: data.tips
            });  
          }
        }
      })
    },
    bindSearch: function(e){
      console.log('点击搜索',e.target.dataset.info)
      console.log('点击搜索',e.target.dataset)
      this.triggerEvent('customEvent',{
        info: e.target.dataset.info,
        inputType: this.properties.inputType
      });
    },
    handleFocus: function(e){
      this.setData({
        tipsShow: true
      });
    },
    handleBlur: function(e){
      this.setData({
        tipsShow: false
      })
    }
  },
})