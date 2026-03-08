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
    // defaultValue: {
    //   type: String,
    //   value: '请输入'
    // },
    placeholder: {
      type: String,
      value: '请输入'
    },
    inputValue: {
      type: String,
      value: ''
    }
  },
  data: {
    tips: [],
    tipsShow: false,
    currentInputValue: ''
  },
  observers: {
    // 'defaultValue': function(val) {
    //   // 初始化时设置默认值
    //   if (!this.data.currentInputValue) {
    //     this.setData({
    //       currentInputValue: val
    //     });
    //   }
    // },
    'inputValue': function(val) {
      // 外部更新值时同步
      if (val) {
        this.setData({
          currentInputValue: val
        });
      }
    }
  },
  lifetimes: {
    attached: function(){
      //在组件实例进入页面节点树时执行
      // 组件初始化时，如果有 inputValue，就显示它
      if (this.properties.inputValue) {
        this.setData({
          currentInputValue: this.properties.inputValue
        });
      }
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
      that.setData({
        currentInputValue: keywords
      });
      var config = require('../../libs/config')
      var amapFile = require('../../libs/amap-wx.130')
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
      maAmapFun.getInputtips({
        keywords: keywords,
        location: lonlat,
        city: city,
        success: function(data){
          console.log(data)
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

      const selectedInfo = e.target.dataset.info;
      // 点击选中后立即更新输入框显示值
      this.setData({
        currentInputValue: selectedInfo.name,
        tipsShow: false // 隐藏提示列表
      });
      this.triggerEvent('customEvent',{
        info: selectedInfo,
        inputType: this.properties.inputType
      });
    },
    //回车事件
    bindConfirm: function(e) {
      console.log('回车确认', this.data.tips);
      const that = this;
      // 如果有提示列表，默认选中第一个
      if (that.data.tips && that.data.tips.length > 0) {
        const firstTip = that.data.tips[0];
        that.setData({
          currentInputValue: firstTip.name,
          tipsShow: false
        });
        
        // 触发事件传递第一个地址信息
        that.triggerEvent('customEvent',{
          info: firstTip,
          inputType: that.properties.inputType
        });
      }
    },
    handleFocus: function(e){
      this.setData({
        tipsShow: true
      });
    },
    handleBlur: function(e){
      setTimeout(() => {
        this.setData({
          tipsShow: false
        });
      }, 200);
    }
  },
})