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
    startInputValue: '', // 起点输入框值
    endInputValue: ''    // 终点输入框值
  },

  onLoad() {
    this.getPoiData() //获取当前位置或指定位置周边
  },

  getPoiData: function(keywords){
    var that = this;
    let params = {
      iconPathSelected: '../../../分类logo/marker-checked.png',
      iconPath: '../../../分类logo/marker-other.png',
      success: function(data){
        console.log('当前位置',data); 
        markersData = data.markers;
        console.log('搜索当前位置，清除目的地信息');
        
        // 增加空值判断，防止markersData为空
        if (!markersData || markersData.length === 0) {
          wx.showToast({
            title: '未获取到位置信息',
            icon: 'none'
          });
          return;
        }

        var lat = parseFloat(markersData[0].latitude);
        var lng = parseFloat(markersData[0].longitude);
        
        that.setData({
          markers: markersData,
          latitude: lat,
          longitude: lng,
          city: markersData[0].name,
          startInputValue: markersData[0].name
        });
        that.showMarkerInfo(markersData,0);
      },
      fail: function(info){
        wx.showModal({
          title: '提示',
          content: info.errMsg,
          showCancel: false
        })
      }
    }; 
    
    if(keywords){
      params.querykeywords = keywords;
    }
    
    //初始化高德地图实例
    var myAmapFun = new amapFile.AMapWX({
      key: gaode_key.config.key
    });
    myAmapFun.getPoiAround(params); 
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
    // 增加空值保护
    if (!data || !data[i]) {
      that.setData({ textData: {} });
      return;
    }
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
    // 重新绘制路线
    this.getRoute(this.data.mapEndObj, 'end');
  },
  
  handleCustomEvent: function(event){
    console.log('接收到组件传递的数据',event.detail);
    var data = event.detail;
    if(data.inputType === 'start'){
      var locationArr = data.info.location.split(',');
      var lng = Number(locationArr[0]);
      var lat = Number(locationArr[1]);
      
      this.setData({
        startInputValue: data.info.name,
        latitude: lat,
        longitude: lng,
        city: data.info.name || data.info.district
      });
      
      // 创建起点标记并更新地图
      var markersData = [{
        iconPath: "../../../分类logo/marker-checked.png",
        id: 0,
        latitude: lat,
        longitude: lng,
        width: 23,
        height: 33,
        name: data.info.name,
        address: data.info.district || data.info.address
      }];
      
      this.setData({
        markers: markersData,
        includePoints: [{
          latitude: lat,
          longitude: lng
        }],
        daohang: false,
        polyline: [] // 清空路线
      });
      
      // 显示标记信息
      this.showMarkerInfo(markersData, 0);
    }else if(data.inputType === 'end'){
      this.setData({
        endInputValue: data.info.name
      });
      //搜索目的地
      this.setData({
        mapEndObj:data.info //目的地信息
      })
      //开始导航
      this.getRoute(data.info,data.inputType)
    }
  },
  
  getRoute: function(info,type){
    var that = this;
    console.log('搜索目的地及路线',info,type)
    
    // 验证经纬度是否有效
    if (!that.data.longitude || !that.data.latitude || !info || !info.location) {
      wx.showToast({
        title: '位置信息不完整',
        icon: 'none'
      });
      return;
    }
    
    // 解析起点经纬度（确保是数值类型）
    var startLng = parseFloat(that.data.longitude);
    var startLat = parseFloat(that.data.latitude);
    
    if(type === 'start'){
      var locationArr = info.location.split(',');
      var lng = Number(locationArr[0]);
      var lat = Number(locationArr[1]);
      
      var markersData = [{
        iconPath: "../../../分类logo/marker-checked.png",
        id: 0,
        latitude: lat,
        longitude: lng,
        width: 23,
        height: 33,
        name: info.name,
        address: info.district
      }];
      
      that.setData({
        city: info.name,
        daohang: false,
        city_e: '',
        latitude: lat,
        longitude: lng,
        polyline: [],
        markers: markersData,
        includePoints: [{
          latitude: lat,
          longitude: lng,
        }]
      });
      
      that.showMarkerInfo(markersData, 0);
      return 
    }else{
      var locationArr = info.location.split(',');
      var endLng = Number(locationArr[0]);
      var endLat = Number(locationArr[1]);
      
      this.setData({
        daohang: true,
        city_e: info.name,
        latitude_e: endLat,
        longitude_e: endLng,
      });
    }
    
    //搜索目的地执行下方代码
    var key = gaode_key.config.key;
    var myAmapFun = new amapFile.AMapWX({
      key: key
    });
  
    //创建请求信息
    var gaodeParams = {
      origin: startLng + "," + startLat, //起点
      destination: that.data.longitude_e + "," + that.data.latitude_e, //终点
      success: function(data){
        console.log('高德接口返回完整数据:', data);
        console.log('paths[0] 详细内容:', data.paths ? data.paths[0] : '无paths字段');
        console.log('paths[0] 所有属性:', data.paths && data.paths[0] ? Object.keys(data.paths[0]) : '无');
        
        var points = [];
        var pathData = null;
        
        // 先尝试所有可能的字段名
        if (data.paths && data.paths.length > 0) {
          pathData = data.paths[0];
          
          // 尝试所有高德可能返回的路线字段名
          var routeField = '';
          if (pathData.polyline) routeField = 'polyline';
          else if (pathData.points) routeField = 'points';
          else if (pathData.path) routeField = 'path';
          else if (pathData.steps) routeField = 'steps';
          else if (pathData.route) routeField = 'route';
          
          console.log('找到的路线字段:', routeField);
          
          // 标准 polyline 字段
          if (pathData.polyline) {
            var pts = pathData.polyline.split(';');
            for (var i = 0; i < pts.length; i++) {
              var coo = pts[i].split(',');
              if (coo.length === 2) {
                points.push({
                  longitude: parseFloat(coo[0]),
                  latitude: parseFloat(coo[1])
                });
              }
            }
          }
          // steps 字段
          else if (pathData.steps && pathData.steps.length > 0) {
            console.log('从steps解析路线');
            for (var s = 0; s < pathData.steps.length; s++) {
              if (pathData.steps[s].polyline) {
                var pts = pathData.steps[s].polyline.split(';');
                for (var p = 0; p < pts.length; p++) {
                  var coo = pts[p].split(',');
                  if (coo.length === 2) {
                    points.push({
                      longitude: parseFloat(coo[0]),
                      latitude: parseFloat(coo[1])
                    });
                  }
                }
              }
            }
          }
          // points 数组字段
          else if (pathData.points && pathData.points.length > 0) {
            for (var j = 0; j < pathData.points.length; j++) {
              points.push({
                longitude: parseFloat(pathData.points[j].longitude || pathData.points[j][0]),
                latitude: parseFloat(pathData.points[j].latitude || pathData.points[j][1])
              });
            }
          }
          // 兜底直线
          else {
            console.log('无任何路线字段，手动画直线');
            points = [
              {longitude: startLng, latitude: startLat},
              {longitude: that.data.longitude_e, latitude: that.data.latitude_e}
            ];
          }
        }
        
        console.log('最终解析路线点数量:', points.length);
        
        // 标记点
        var markersData = [{
          iconPath: "../../../分类logo/mapicon_start.png",
          id: 0,
          latitude: startLat,
          longitude: startLng,
          width: 23,
          height: 23,
          zIndex: 100
        },{
          iconPath: "../../../分类logo/mapicon_end.png",
          id: 1,
          latitude: that.data.latitude_e,
          longitude: that.data.longitude_e,
          width: 24,
          height: 34,
          zIndex: 100
        }];
        
        // 距离和耗时
        var distance = (pathData && pathData.distance) 
          ? (pathData.distance/1000).toFixed(1) + 'km' 
          : '';
        var cost = (pathData && pathData.duration) 
          ? Math.ceil(pathData.duration/60) + '分钟' 
          : '';
        
        // 设置路线
        that.setData({
          polyline: [{
            points: points,
            color: "#0091ff",
            width: 8,
            arrowLine: true,
            zIndex: 99
          }],
          markers: markersData,
          includePoints: points,
          distance: distance,
          cost: cost
        });
        
        that.showMarkerInfo(markersData,1);
      },
      fail: function(info){
        console.log('路线获取失败',info);
        wx.showToast({
          title: '路线获取失败：' + (info.errMsg || '未知错误'),
          icon: 'none',
          duration: 3000
        });
      }
    };
    
    // 选择出行方式
    if(that.data.gaode_type === 'car'){
      myAmapFun.getDrivingRoute(gaodeParams);
    }else if(that.data.gaode_type === 'walk'){
      myAmapFun.getWalkingRoute(gaodeParams);
    }else if(that.data.gaode_type === 'bus'){
      myAmapFun.getTransitRoute(gaodeParams);
    }else if(that.data.gaode_type === 'riding'){
      myAmapFun.getRidingRoute(gaodeParams);
    }
  },
  
  // 手动定位到当前标记位置
  onMapTap(e) {
    console.log('地图点击', e);
  }
})