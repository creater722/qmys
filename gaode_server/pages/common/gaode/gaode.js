var gaode_key = require('../../../libs/config')
var amapFile = require('../../../libs/amap-wx.130')
var markersData = []

Page({
  data: {
    markers: [], // 标记点
    latitude: '', 
    longitude: '', 
    city: '',
    city_e: '', //目的地
    latitude_e: '', 
    longitude_e: '', 
    textData: {}, //地点描述信息
    gaode_type: 'car',
    polyline: [],
    includePoints: [],
    transit: [], //公交车信息
    mapEndObj: {}, //目的地信息
    cost: '',
    daohang: false,
    distance: '',
    mapState: true, //目的地搜索状态
  },

  onLoad() {
    this.getPoiData() //获取当前位置或指定位置周边
  },

  getPoiData: function(keywords){
    var that = this;
    // 1. 先定义基础参数对象
    let params = {
      iconPathSelected: '../../../分类logo/marker-checked.png',
      iconPath: '../../../分类logo/marker-other.png',
      success: function(data){
        console.log('当前位置',data); // 把逗号改成分号，规范语法
        markersData = data.markers;
        //搜索当前位置 附近poi
        console.log('搜索当前位置，清除目的地信息');
        that.setData({
          markers: markersData,
          latitude: markersData[0].latitude,
          longitude: markersData[0].longitude, // 修复经纬度赋值错误
          city: markersData[0].name,
        });
        that.showMarkerInfo(markersData,0);
      },
      fail: function(info){
        wx.showModal({
          title: info.errMsg
        })
      }
    }; // 把逗号改成分号，结束对象定义
    
    // 2. 正确添加条件参数（对象定义完成后）
    if(keywords){
      params.querykeywords = keywords;
    }
    
    // 3. 初始化高德地图实例（修复变量名拼写错误）
    var myAmapFun = new amapFile.AMapWX({
      key: gaode_key.config.key
    });
    myAmapFun.getPoiAround(params); // 修复 maAmapFun 为 myAmapFun
  },

  // 标记点点击事件
  makertap(e) {
    var id = e.markerId;
    var that = this;
    that.showMarkerInfo(markersData,id);
    that.changeMarkerColor(markersData,id);
  },

  showMarkerInfo: function(data,i){
    var that = this;
    that.setData({
      textData: {
        name: data[i].name,
        desc: data[i].address
      }
    });
  },

  changeMarkerColor: function(data,i){
    var that = this;
    var markers = [];
    // 修复循环边界错误：j <= data.length 改为 j < data.length
    for (var j=0; j < data.length; j++){
      if(j==i){
        data[j].iconPath='../../../分类logo/marker-checked.png';
      }else{
        data[j].iconPath='../../../分类logo/marker-other.png';
      }   
      markers.push(data[j]);   
    }
    that.setData({
      markers: markers
    });
  },
  //切换方式
  changeGaodeType(event){
    console.log('切换方式，绘制路线',event.detail);
    this.setData({
      gaode_type: event.detail.gaode_type
    })
    if(!this.data.longitude_e){
      return
    }
    //绘制路线
  },
  handleCustomEvent: function(event){
    console.log('接收到组件传递的数据',event.detail);
    const data = event.detail
    if(data.inputType === 'end'){
      this.setData({
        mapEndObj:data.info
      })
    }
  }
})