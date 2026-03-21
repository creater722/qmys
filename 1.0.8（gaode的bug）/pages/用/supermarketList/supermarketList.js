var gaode_key = require('../../../libs/config')
var amapFile = require('../../../libs/amap-wx.130')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    supermarketList: [],
    userInfo: null,
    isLoading: true,
    currentLocation: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo(() => {
      this.getNearbySupermarkets();
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getUserInfo();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getNearbySupermarkets(true);
  },

  /**
   * 获取用户信息
   */
  getUserInfo(callback) {
    try {
      let userInfo = wx.getStorageSync('userInfo');
      const userId = wx.getStorageSync('userId');
      const token = wx.getStorageSync('token');

      if (userInfo && typeof userInfo === 'string') {
        try {
          userInfo = JSON.parse(userInfo);
        } catch (e) {
          userInfo = null;
        }
      }

      const isLogin = !!userId && !!token && userInfo;
      
      this.setData({
        userInfo: isLogin ? userInfo : null
      });
      
      callback && callback();
    } catch (err) {
      console.error('获取用户信息失败详情：', err);
      this.setData({ userInfo: null });
      callback && callback();
    }
  },

  /**
   * 获取附近超市（数据库接口）
   */
  getNearbySupermarkets(isRefresh = false) {
    console.log('开始获取附近超市');
    this.setData({ isLoading: true }, () => {
      console.log('isLoading设置为true');
    });
    
    const app = getApp();
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('token');
    
    // 设置超时机制，确保isLoading状态一定会被重置
    const timeoutId = setTimeout(() => {
      console.log('超时，设置isLoading为false');
      that.setData({ isLoading: false }, () => {
        console.log('isLoading设置为false');
      });
      if (isRefresh) {
        wx.stopPullDownRefresh();
      }
      wx.showToast({ title: '获取超市信息超时', icon: 'none' });
    }, 10000); // 10秒超时
    
    var that = this;
    
    // 首先尝试从数据库获取超市列表
    if (userId && token) {
      wx.request({
        url: `${app.getBaseUrl()}/api/supermarkets/nearby`,
        method: 'GET',
        timeout: 10000,
        header: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        success: function(res) {
          console.log('数据库接口返回超市列表：', res);
          clearTimeout(timeoutId);
          
          if (res.data?.code === 200 && res.data.data && res.data.data.length > 0) {
            const supermarkets = res.data.data.map((item, index) => ({
              id: item.id || index + 1,
              name: item.name || '未知超市',
              address: item.address || '暂无地址',
              distance: item.distance || 0,
              latitude: item.latitude || 0,
              longitude: item.longitude || 0,
              image: item.image || '/分类logo/超市.png'
            }));
            
            that.setData({
              supermarketList: supermarkets,
              isLoading: false
            }, () => {
              console.log('数据库接口超市数据设置完成');
              if (isRefresh) {
                wx.stopPullDownRefresh();
              }
            });
          } else {
            // 数据库无数据，使用高德地图API
            that.getSupermarketsFromAmap(isRefresh, timeoutId);
          }
        },
        fail: function(err) {
          console.error('数据库接口请求失败，使用高德地图API：', err);
          clearTimeout(timeoutId);
          that.getSupermarketsFromAmap(isRefresh, timeoutId);
        }
      });
    } else {
      // 未登录，直接使用高德地图API
      that.getSupermarketsFromAmap(isRefresh, timeoutId);
    }
  },

  /**
   * 从高德地图API获取超市列表
   */
  getSupermarketsFromAmap(isRefresh, timeoutId) {
    var that = this;
    
    // 首先获取用户当前位置
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        console.log('获取当前位置成功:', res);
        const latitude = res.latitude;
        const longitude = res.longitude;
        
        try {
          console.log('创建高德地图实例');
          var myAmapFun = new amapFile.AMapWX({ key: gaode_key.config.key });
          
          console.log('调用getPoiAround');
          myAmapFun.getPoiAround({
            location: `${longitude},${latitude}`,
            querykeywords: '超市',
            success: function(data) {
              console.log('获取附近超市成功:', data);
              
              try {
                if (data.markers && data.markers.length > 0) {
                  const supermarkets = data.markers.map((marker, index) => {
                    let image = '/分类logo/超市.png';
                    
                    let distance = that.calculateDistance(
                      latitude, longitude,
                      marker.latitude, marker.longitude
                    );
                    
                    return {
                      id: index + 1,
                      name: marker.name,
                      address: marker.address,
                      distance: distance,
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                      image: image
                    };
                  });
                  
                  console.log('准备设置超市数据:', supermarkets.length);
                  that.setData({
                    supermarketList: supermarkets,
                    currentLocation: {
                      latitude: latitude,
                      longitude: longitude,
                      name: '当前位置'
                    },
                    isLoading: false
                  }, () => {
                    console.log('超市数据和isLoading设置完成');
                    clearTimeout(timeoutId);
                    if (isRefresh) {
                      wx.stopPullDownRefresh();
                    }
                  });
                } else {
                  console.log('未找到附近超市');
                  that.setData({ 
                    supermarketList: [],
                    currentLocation: {
                      latitude: latitude,
                      longitude: longitude,
                      name: '当前位置'
                    },
                    isLoading: false 
                  }, () => {
                    console.log('超市列表设置为空，isLoading设置为false');
                    clearTimeout(timeoutId);
                    if (isRefresh) {
                      wx.stopPullDownRefresh();
                    }
                  });
                  wx.showToast({ title: '未找到附近超市', icon: 'none' });
                }
              } catch (error) {
                console.error('处理超市数据失败:', error);
                that.setData({ 
                  supermarketList: [],
                  currentLocation: {
                    latitude: latitude,
                    longitude: longitude,
                    name: '当前位置'
                  },
                  isLoading: false 
                }, () => {
                  console.log('处理数据失败，isLoading设置为false');
                  clearTimeout(timeoutId);
                  if (isRefresh) {
                    wx.stopPullDownRefresh();
                  }
                });
                wx.showToast({ title: '处理超市信息失败', icon: 'none' });
              }
            },
            fail: function(info) {
              console.error('获取附近超市失败:', info);
              that.setData({ 
                supermarketList: [],
                currentLocation: {
                  latitude: latitude,
                  longitude: longitude,
                  name: '当前位置'
                },
                isLoading: false 
              }, () => {
                console.log('获取失败，isLoading设置为false');
                clearTimeout(timeoutId);
                if (isRefresh) {
                  wx.stopPullDownRefresh();
                }
              });
              wx.showToast({ title: '获取超市信息失败', icon: 'none' });
            }
          });
        } catch (error) {
          console.error('调用高德地图API失败:', error);
          that.setData({ 
            supermarketList: [],
            currentLocation: {
              latitude: latitude,
              longitude: longitude,
              name: '当前位置'
            },
            isLoading: false 
          }, () => {
            console.log('API调用失败，isLoading设置为false');
            clearTimeout(timeoutId);
            if (isRefresh) {
              wx.stopPullDownRefresh();
            }
          });
          wx.showToast({ title: '初始化地图失败', icon: 'none' });
        }
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        that.setData({ 
          supermarketList: [],
          isLoading: false 
        }, () => {
          console.log('获取位置失败，isLoading设置为false');
          clearTimeout(timeoutId);
          if (isRefresh) {
            wx.stopPullDownRefresh();
          }
        });
        wx.showToast({ title: '获取位置失败，请检查定位权限', icon: 'none' });
      }
    });
  },

  /**
   * 跳转到超市详情页
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const supermarket = this.data.supermarketList.find(item => item.id === id);
    
    if (supermarket) {
      wx.navigateTo({
        url: `/pages/用/supermarketDetail/supermarketDetail?id=${id}&name=${encodeURIComponent(supermarket.name)}&address=${encodeURIComponent(supermarket.address)}&latitude=${supermarket.latitude}&longitude=${supermarket.longitude}&distance=${supermarket.distance}`
      });
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    wx.showToast({ title: '已加载全部超市', icon: 'none', duration: 1000 });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '附近超市',
      path: '/pages/用/supermarketList/supermarketList',
      success: () => {
        wx.showToast({ title: '分享成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '分享失败', icon: 'none' });
      }
    };
  },

  /**
   * 跳转到收藏夹页面
   */
  goToCollection() {
    wx.navigateTo({
      url: '/pages/用/supermarketCollection/supermarketCollection'
    });
  },

  /**
   * 返回上一级页面
   */
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({ url: '/pages/用/用' });
        }
      });
    } else {
      wx.redirectTo({ url: '/pages/用/用' });
    }
  },

  /**
   * 计算两点之间的距离（Haversine公式）
   * @param {number} lat1 - 起点纬度
   * @param {number} lng1 - 起点经度
   * @param {number} lat2 - 终点纬度
   * @param {number} lng2 - 终点经度
   * @returns {number} - 距离（米）
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const radLat1 = lat1 * Math.PI / 180.0;
    const radLat2 = lat2 * Math.PI / 180.0;
    const a = radLat1 - radLat2;
    const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // 地球半径（千米）
    s = Math.round(s * 10000) / 10; // 转换为米并保留整数
    return s;
  },

  /**
   * 图片加载失败处理
   */
  imageError(e) {
    console.log('图片加载失败:', e);
    const index = e.currentTarget.dataset.index;
    const supermarketList = [...this.data.supermarketList];
    // 设置默认超市图标
    supermarketList[index].image = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=supermarket%20icon%20shopping%20cart%20simple&image_size=square_hd';
    this.setData({ supermarketList });
  }
});