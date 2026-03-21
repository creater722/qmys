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
    gaode_type: 'bus',
    polyline: [],
    includePoints: [],
    transit: [], //公交/地铁信息
    mapEndObj: {}, //目的地信息
    cost: '',
    daohang: false,
    distance: '',
    mapState: true, //目的地搜索状态
    startInputValue: '', // 起点输入框值
    endInputValue: '',    // 终点输入框值
    mapScale: 16,         // 地图缩放级别，默认放大让附近点显示在中间80%区域
    startLongitude: '',   // 起点经度（固定，不随地图中心变化）
    startLatitude: ''     // 起点纬度（固定，不随地图中心变化）
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
          startInputValue: markersData[0].name,
          startLongitude: lng,  // 保存起点经度
          startLatitude: lat    // 保存起点纬度
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
    var that = this;
    var newType = event.detail.gaode_type;
    
    this.setData({
      gaode_type: newType
    })
    
    if(!this.data.longitude_e){
      return
    }
    
    // 如果是公交/地铁模式
    if(newType === 'bus'){
      // 检查是否已有公交/地铁数据
      if(that.data.transits && that.data.transits.length > 0){
        // 已有数据，保持当前状态，只更新界面状态
        that.setData({
          mapState: true, // 确保显示公交列表而不是搜索中
          daohang: true   // 确保显示导航状态
        });
        return;
      } else {
        // 没有数据，需要重新获取
        console.log('公交/地铁模式：没有数据，重新获取');
      }
    }
    
    // 使用保存的起点坐标重新绘制路线
    var startLng = that.data.startLongitude || that.data.longitude;
    var startLat = that.data.startLatitude || that.data.latitude;
    
    // 恢复地图中心点为起点
    that.setData({
      longitude: startLng,
      latitude: startLat
    });
    
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
        city: data.info.name || data.info.district,
        startLongitude: lng,  // 保存起点经度
        startLatitude: lat    // 保存起点纬度
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
      if (data.info && data.info.location) {
        // 有目的地，解析坐标并移动到目的地位置
        var locationArr = data.info.location.split(',');
        var lng = Number(locationArr[0]);
        var lat = Number(locationArr[1]);
        
        this.setData({
          endInputValue: data.info.name,
          mapEndObj: data.info, //目的地信息
          longitude: lng,
          latitude: lat,
          longitude_e: lng,
          latitude_e: lat
        });
        
        // 创建目的地标记
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
      } else {
        // 目的地被清空，回到当前位置
        var currentLng = this.data.startLongitude || this.data.longitude;
        var currentLat = this.data.startLatitude || this.data.latitude;
        
        this.setData({
          endInputValue: '',
          mapEndObj: {},
          longitude_e: '',
          latitude_e: '',
          longitude: currentLng,
          latitude: currentLat,
          daohang: false,
          polyline: [] // 清空路线
        });
        
        // 回到当前位置标记
        var markersData = [{
          iconPath: "../../../分类logo/marker-checked.png",
          id: 0,
          latitude: currentLat,
          longitude: currentLng,
          width: 23,
          height: 33
        }];
        
        this.setData({
          markers: markersData,
          includePoints: [{
            latitude: currentLat,
            longitude: currentLng
          }]
        });
      }
    }
  },

  // 确定路线
  confirmRoute: function(){
    if (!this.data.mapEndObj || !this.data.mapEndObj.location) {
      wx.showToast({
        title: '请先输入目的地',
        icon: 'none'
      });
      return;
    }
    
    var that = this;
    
    // 先获取当前模式的路线
    this.getRoute(this.data.mapEndObj, 'end');
    
    // 同时预获取公交/地铁数据，方便切换时直接显示
    var startLng = that.data.startLongitude || that.data.longitude;
    var startLat = that.data.startLatitude || that.data.latitude;
    
    // 解析终点坐标
    var locationArr = that.data.mapEndObj.location.split(',');
    var endLng = Number(locationArr[0]);
    var endLat = Number(locationArr[1]);
    
    // 确保终点坐标已设置
    if (!that.data.longitude_e) {
      that.setData({
        longitude_e: endLng,
        latitude_e: endLat
      });
    }
    
    // 预获取公交/地铁数据
    var key = gaode_key.config.key;
    var amapFile = require('../../../libs/amap-wx.130');
    var myAmapFun = new amapFile.AMapWX({key: key});
    
    // 使用起点坐标反查城市名称
    var cityName = that.data.city;
    if (cityName && cityName.indexOf('市') > -1) {
      cityName = cityName.replace('市', '');
    }
    
    myAmapFun.getTransitRoute({
      origin: startLng + "," + startLat,
      destination: endLng + "," + endLat,
      city: cityName || '赣州',
      success: function(data){
        console.log('预获取公交/地铁信息成功', data);
        var transits = [];
        if(data && data.transits && Array.isArray(data.transits) && data.transits.length > 0){
          transits = data.transits;
          for(var i = 0; i < transits.length; i++){
            var segments = transits[i].segments;
            transits[i].transport = [];
            transits[i].busNames = '';
            for(var j = 0; j < segments.length; j++){
              // 处理公交信息
              if(segments[j].bus && segments[j].bus.buslines 
              && segments[j].bus.buslines[0] 
              && segments[j].bus.buslines[0].name){
                var name = segments[j].bus.buslines[0].name;
                if(j !== 0){
                  name = ' → ' + name;
                }
                transits[i].transport.push(name);
              }
              // 处理地铁信息
              if(segments[j].railway && segments[j].railway.railwaylines 
              && segments[j].railway.railwaylines[0] 
              && segments[j].railway.railwaylines[0].name){
                var name = segments[j].railway.railwaylines[0].name;
                if(j !== 0 && transits[i].transport.length === 0){
                  name = ' → ' + name;
                }
                transits[i].transport.push(name);
              }
            }
            // 拼接公交/地铁路线名称
            transits[i].busNames = transits[i].transport.join('');
            // 计算总时间和距离
            transits[i].durationStr = Math.ceil(transits[i].duration / 60) + '分钟';
            transits[i].distanceStr = transits[i].distance > 1000 
              ? (transits[i].distance / 1000).toFixed(1) + 'km' 
              : transits[i].distance + 'm';
            // 步行距离
            var walkingDistance = 0;
            for(var j = 0; j < segments.length; j++){
              if(segments[j].walking && segments[j].walking.distance){
                walkingDistance += parseInt(segments[j].walking.distance);
              }
            }
            transits[i].walkingStr = walkingDistance > 1000 
              ? '步行' + (walkingDistance / 1000).toFixed(1) + 'km' 
              : '步行' + walkingDistance + 'm';
          }
          
          // 保存公交/地铁数据，但不切换界面
          that.setData({
            transits: transits,
            transit: transits[0] || {}
          });
          
          console.log('公交/地铁数据已预获取并保存，数量:', transits.length);
        }
      },
      fail: function(info){
        console.log('预获取公交/地铁信息失败', info);
        // 预获取失败不影响主流程
      }
    });
  },

  // 开始导航 - 直接打开微信内置地图
  startNavigation: function(){
    var that = this;
    
    // 检查是否有目的地
    if(!that.data.latitude_e || !that.data.longitude_e){
      wx.showToast({
        title: '请先选择目的地',
        icon: 'none'
      });
      return;
    }
    
    // 直接打开微信内置地图
    var endLat = that.data.latitude_e;
    var endLng = that.data.longitude_e;
    var endName = that.data.city_e || '目的地';
    
    that.openWechatMap(endLat, endLng, endName);
  },
  
  // 使用微信内置地图
  openWechatMap: function(lat, lng, name){
    wx.openLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      name: name,
      scale: 18,
      success: function(){
        console.log('打开微信内置地图成功');
      },
      fail: function(err){
        console.log('打开微信内置地图失败', err);
        wx.showToast({
          title: '打开地图失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 打车功能 - 直接打开微信内置地图显示目的地
  callTaxi: function(){
    var that = this;
    
    // 检查是否有目的地
    if(!that.data.latitude_e || !that.data.longitude_e){
      wx.showToast({
        title: '请先选择目的地',
        icon: 'none'
      });
      return;
    }
    
    // 直接打开微信内置地图显示目的地
    var endLat = that.data.latitude_e;
    var endLng = that.data.longitude_e;
    var endName = that.data.city_e || '目的地';
    
    that.openWechatMap(endLat, endLng, endName);
  },
  
  // 公交/地铁路线选择
  selectBusRoute: function(e){
    var that = this;
    var index = e.currentTarget.dataset.index;
    var selectedRoute = that.data.transits[index];
    
    console.log('选择的公交/地铁路线', selectedRoute);
    
    // 跳转到高德地图的公交导航
    var startLat = that.data.latitude;
    var startLng = that.data.longitude;
    var endLat = that.data.latitude_e;
    var endLng = that.data.longitude_e;
    var endName = that.data.city_e || '目的地';
    
    wx.navigateToMiniProgram({
      appId: 'wx5d972fbbd0b48e68', // 高德地图小程序 AppID
      path: `pages/index/index?navigate=yes&key=${gaode_key.config.key}&startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}&endName=${encodeURIComponent(endName)}&naviType=1`, // naviType=1 表示公交
      success: function(res){
        console.log('打开高德地图公交导航成功');
      },
      fail: function(err){
        console.log('打开高德地图失败', err);
        // 备用方案：使用微信内置地图
        wx.openLocation({
          latitude: parseFloat(endLat),
          longitude: parseFloat(endLng),
          name: endName,
          address: that.data.textData.desc || '',
          scale: 18,
          success: function(){
            console.log('打开微信内置地图成功');
          },
          fail: function(err){
            console.log('打开微信内置地图失败', err);
            wx.showModal({
              title: '导航提示',
              content: '请安装高德地图 App 进行导航',
              showCancel: false
            });
          }
        });
      }
    });
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
    // 使用保存的起点坐标，如果没有则使用当前坐标
    var routeStartLng = that.data.startLongitude || startLng;
    var routeStartLat = that.data.startLatitude || startLat;
    
    var key = gaode_key.config.key;
    var myAmapFun = new amapFile.AMapWX({
      key: key
    });
  
    //创建请求信息
    var gaodeParams = {
      origin: routeStartLng + "," + routeStartLat, //起点（使用保存的固定起点坐标）
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
        
        // 使用保存的起点坐标创建标记点
        var markerStartLng = that.data.startLongitude || startLng;
        var markerStartLat = that.data.startLatitude || startLat;
        
        // 标记点
        var markersData = [{
          iconPath: "../../../分类logo/mapicon_start.png",
          id: 0,
          latitude: markerStartLat,
          longitude: markerStartLng,
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
        
        // 根据不同出行方式计算时间
        var duration = pathData && pathData.duration ? pathData.duration : 0;
        var cost = '';
        
        if(that.data.gaode_type === 'taxi'){
          // 打车：使用驾车时间（约是步行时间的 1/12，考虑红绿灯等因素）
          cost = Math.ceil(duration/60/12) + '分钟';
        }else if(that.data.gaode_type === 'riding'){
          // 骑行：骑行速度约是步行速度的 3-4 倍
          cost = Math.ceil(duration/60/3.5) + '分钟';
        }else{
          // 步行或其他
          cost = Math.ceil(duration/60) + '分钟';
        }
        
        // 使用 includePoints 让地图自动适应显示所有点，不需要手动设置缩放级别
        // 设置一个适中的初始缩放级别，地图会根据 includePoints 自动调整
        
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
        
        // 根据不同出行方式计算时间
        var duration = pathData && pathData.duration ? pathData.duration : 0;
        var cost = '';
        
        if(that.data.gaode_type === 'taxi'){
          // 打车：使用驾车时间（约是步行时间的 1/12，考虑红绿灯等因素）
          cost = Math.ceil(duration/60/12) + '分钟';
        }else if(that.data.gaode_type === 'riding'){
          // 骑行：骑行速度约是步行速度的 3-4 倍
          cost = Math.ceil(duration/60/3.5) + '分钟';
        }else{
          // 步行或其他
          cost = Math.ceil(duration/60) + '分钟';
        }
        
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
    }else if(that.data.gaode_type === 'taxi' || that.data.gaode_type === 'riding'){
      // 打车和骑行使用相同的路线规划
      myAmapFun.getWalkingRoute(gaodeParams);
    }else if(that.data.gaode_type === 'bus'){
      // 公交/地铁单独处理
      that.getBusRoute(myAmapFun, startLng, startLat);
    }
  },

  // 公交/地铁路线单独处理
  getBusRoute: function(myAmapFun, startLng, startLat){
    var that = this;
    // 设置搜索状态
    that.setData({
      mapState: false
    });
    
    // 使用起点坐标反查城市名称，确保使用正确的城市
    var cityName = that.data.city;
    // 如果city包含"市"字，去掉它
    if (cityName && cityName.indexOf('市') > -1) {
      cityName = cityName.replace('市', '');
    }
    
    console.log('公交/地铁查询参数:', {
      origin: startLng + "," + startLat,
      destination: that.data.longitude_e + "," + that.data.latitude_e,
      city: cityName || '赣州'
    });
    
    myAmapFun.getTransitRoute({
      origin: startLng + "," + startLat,
      destination: that.data.longitude_e + "," + that.data.latitude_e,
      city: cityName || '赣州',
      success: function(data){
        console.log('公交/地铁信息', data);
        var transits = [];
        
        // 检查返回数据的完整性
        if(!data) {
          console.log('公交/地铁数据为空');
          that.setData({
            transits: [],
            transit: {},
            mapState: true,
            distance: '',
            cost: ''
          });
          return;
        }
        
        // 处理不同的数据结构
        if(data.transits && Array.isArray(data.transits) && data.transits.length > 0){
          transits = data.transits;
          for(var i = 0; i < transits.length; i++){
            var segments = transits[i].segments;
            transits[i].transport = [];
            transits[i].busNames = '';
            for(var j = 0; j < segments.length; j++){
              // 处理公交信息
              if(segments[j].bus && segments[j].bus.buslines 
              && segments[j].bus.buslines[0] 
              && segments[j].bus.buslines[0].name){
                var name = segments[j].bus.buslines[0].name;
                if(j !== 0){
                  name = ' → ' + name;
                }
                transits[i].transport.push(name);
              }
              // 处理地铁信息
              if(segments[j].railway && segments[j].railway.railwaylines 
              && segments[j].railway.railwaylines[0] 
              && segments[j].railway.railwaylines[0].name){
                var name = segments[j].railway.railwaylines[0].name;
                if(j !== 0 && transits[i].transport.length === 0){
                  name = ' → ' + name;
                }
                transits[i].transport.push(name);
              }
            }
            // 拼接公交/地铁路线名称
            transits[i].busNames = transits[i].transport.join('');
            // 计算总时间和距离
            transits[i].durationStr = Math.ceil(transits[i].duration / 60) + '分钟';
            transits[i].distanceStr = transits[i].distance > 1000 
              ? (transits[i].distance / 1000).toFixed(1) + 'km' 
              : transits[i].distance + 'm';
            // 步行距离
            var walkingDistance = 0;
            for(var j = 0; j < segments.length; j++){
              if(segments[j].walking && segments[j].walking.distance){
                walkingDistance += parseInt(segments[j].walking.distance);
              }
            }
            transits[i].walkingStr = walkingDistance > 1000 
              ? '步行' + (walkingDistance / 1000).toFixed(1) + 'km' 
              : '步行' + walkingDistance + 'm';
          }
        }
        
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
        
        that.setData({
          transits: transits,
          transit: transits[0] || {}, // 默认第一条路线
          markers: markersData,
          daohang: true,
          mapState: true, // 公交/地铁搜索完成
          polyline: [], // 公交/地铁不显示路线
          includePoints: [{
            latitude: startLat,
            longitude: startLng
          }, {
            latitude: that.data.latitude_e,
            longitude: that.data.longitude_e
          }],
          distance: transits[0] ? transits[0].distanceStr : '',
          cost: transits[0] ? transits[0].durationStr : ''
        });
        
        that.showMarkerInfo(markersData, 1);
      },
      fail: function(info){
        console.log('公交/地铁路线获取失败', info);
        that.setData({
          transits: [], // 清空公交数据
          transit: {},
          mapState: true, // 搜索结束
          distance: '',
          cost: ''
        });
        wx.showModal({
          title: '提示',
          content: info.errMsg || '获取公交/地铁路线失败',
          showCancel: false
        });
      }
    });
  },
  
  // 手动定位到当前标记位置
  onMapTap(e) {
    console.log('地图点击', e);
  }
})