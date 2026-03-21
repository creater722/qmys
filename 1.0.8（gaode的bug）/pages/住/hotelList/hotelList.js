Page({
  data: {
    hotelList: [],        // 酒店列表
    isLoading: false,     // 加载中
    hasMore: true,        // 有更多数据
    pageNum: 1,           // 当前页码
    pageSize: 10,         // 每页条数

    // 筛选条件
    searchKey: '',        // 搜索关键词
    currentCity: '',      // 当前选中城市（字符串类型）
    currentDistrict: '',  // 新增：当前选中区县
    currentStar: '',      // 当前选中星级
    currentPrice: '',     // 当前选中价格区间
    currentSort: '',      // 当前选中排序

    // 筛选数据源（重构：替换为带区县的城市数据）
    cityDataList: [       // 新增：全国核心城市+区县数据
      {
        cityName:'赣州市',
        districts: ['章贡区'] // 修复：统一字段名为districts
      },
      {
        cityName: '北京市',
        districts: ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区']
      },
      {
        cityName: '上海市',
        districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区']
      },
      {
        cityName: '广州市',
        districts: ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区']
      },
      {
        cityName: '深圳市',
        districts: ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区']
      },
      {
        cityName: '南昌市',
        districts: ['南昌县', '东湖区', '西湖区', '青云谱区', '青山湖区', '新建区', '红谷滩区']
      },
      {
        cityName: '杭州市',
        districts: ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临平区']
      },
      {
        cityName: '成都市',
        districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '双流区']
      }
    ],
    districtList: [],     // 新增：选中城市后的区县列表
    showCitySelector: false, // 新增：城市选择弹窗是否显示
    starList: ['1星', '2星', '3星', '4星', '5星'],
    priceRangeList: ['0-200元', '200-500元', '500-1000元', '1000元以上'],
    sortList: ['价格从低到高', '价格从高到低', '评分从高到低'],
    
    // 伪TabBar相关
    activeTab: 'hotel'    // 默认选中酒店Tab
  },

  // 返回上一页
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({ url: '/pages/index/index' });
    }
  },

  /**
   * 页面加载
   */
  onLoad(options) {
    this.loadHotelList();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载酒店列表（核心方法）- 新增区县筛选参数 + 修复地址拼接
   */
  loadHotelList(callback) {
    // 防重复加载+无更多数据时直接返回
    if (this.data.isLoading || !this.data.hasMore) {
      callback && callback();
      return;
    }

    this.setData({ isLoading: true });

    // 构建筛选参数 - 新增区县筛选
    const params = {
      pageNum: this.data.pageNum,
      pageSize: this.data.pageSize,
      keyword: this.data.searchKey.trim()
    };

    // 城市筛选
    if (this.data.currentCity) params.city = this.data.currentCity;
    // 新增：区县筛选
    if (this.data.currentDistrict) params.district = this.data.currentDistrict;
    // 星级筛选（提取数字）
    if (this.data.currentStar) params.starRating = this.data.currentStar.replace('星', '');
    // 价格筛选（解析区间）
    if (this.data.currentPrice) {
      const priceRange = this.data.currentPrice.split('-');
      switch (priceRange[0]) {
        case '0':
          params.minPrice = 0;
          params.maxPrice = 200;
          break;
        case '200':
          params.minPrice = 200;
          params.maxPrice = 500;
          break;
        case '500':
          params.minPrice = 500;
          params.maxPrice = 1000;
          break;
        default: // 1000元以上
          params.minPrice = 1000;
          break;
      }
    }
    // 排序筛选
    if (this.data.currentSort) {
      const sortMap = {
        '价格从低到高': 'minPrice_asc',
        '价格从高到低': 'minPrice_desc',
        '评分从高到低': 'rating_desc'
      };
      params.sort = sortMap[this.data.currentSort];
    }

    console.log('【酒店列表】请求参数：', params);

    // ✅ 核心修复：正确获取全局App实例并拼接地址
    const app = getApp();
    // 调用后端接口
    wx.request({
      url: `${app.getBaseUrl()}/api/hotels`, // ✅ 修复：反引号+正确拼接全局地址
      method: 'GET',
      data: params,
      timeout: 10000,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        console.log('【酒店列表】接口返回数据：', res.data);
        
        if (res.data?.code === 200) {
          const newList = res.data.data?.list || [];
          console.log('【酒店列表】解析后的列表：', newList);
          
          // 数据格式化：兼容字段 + 安全处理
          const formatList = newList.map(item => ({
            id: item.id || '',
            name: item.name || '未知酒店',
            city: item.city || '',
            district: item.district || '',
            address: item.address || '暂无地址',
            starRating: item.starRating || item.star_rating || 0,
            minPrice: Number(item.minPrice || item.min_price || item.price || 0),
            rating: Number(item.rating || 0),
            coverImage: item.coverImage || item.cover_image || 'https://picsum.photos/200/150?random=1'
          }));
          
          const hotelList = this.data.pageNum === 1 
            ? formatList 
            : [...this.data.hotelList, ...formatList];
      
          this.setData({
            hotelList,
            hasMore: formatList.length === this.data.pageSize,
            pageNum: this.data.pageNum + 1
          });
          
          if (this.data.pageNum === 2 && formatList.length === 0) {
            wx.showToast({ title: '暂无符合条件的酒店', icon: 'none', duration: 2000 });
          }
        } else {
          wx.showToast({ 
            title: res.data?.message || '获取数据失败', 
            icon: 'none', 
            duration: 2000 
          });
        }
      },
      fail: (err) => {
        console.error('【酒店列表】接口请求失败：', err);
        wx.showToast({ title: '服务器连接失败，请稍后重试', icon: 'none', duration: 2000 });
      },
      complete: () => {
        this.setData({ isLoading: false });
        callback && callback();
      }
    });
  },

  /**
   * 加载更多（上拉触底）
   */
  onReachBottom() {
    this.loadHotelList();
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value });
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.setData({
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  // ========== 新增：二级城市筛选核心方法 ==========
  /**
   * 打开城市选择弹窗
   */
  openCitySelector() {
    this.setData({ showCitySelector: true });
  },

  /**
   * 关闭城市选择弹窗
   */
  closeCitySelector() {
    this.setData({ showCitySelector: false });
  },

  /**
   * 选择一级城市（触发区县列表更新）
   */
  selectCity(e) {
    // 取出完整的城市对象，再提取名称字符串
    const selectedCityObj = e.currentTarget.dataset.city;
    const cityName = selectedCityObj.cityName; // 仅提取名称字符串
    
    // 找到选中城市对应的区县列表
    const targetCity = this.data.cityDataList.find(item => item.cityName === cityName);
    const districtList = targetCity ? targetCity.districts : [];

    this.setData({
      currentCity: cityName, 
      currentDistrict: '', // 切换城市时清空区县选择
      districtList: districtList,
      pageNum: 1,
      hotelList: [],
      hasMore: true,
      showCitySelector: false // 选择后关闭弹窗
    });
    this.loadHotelList();
  },

  /**
   * 选择二级区县
   */
  onDistrictChange(e) {
    const index = e.detail.value;
    if (index === null || index === undefined) return;
    
    const district = this.data.districtList[index] || '';
    this.setData({
      currentDistrict: district,
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  // ========== 原有筛选方法保留（仅调整城市筛选逻辑） ==========
  /**
   * 星级筛选
   */
  onStarChange(e) {
    const index = e.detail.value;
    if (index === null || index === undefined) return;
    
    const star = this.data.starList[index] || '';
    this.setData({
      currentStar: star,
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  /**
   * 价格筛选
   */
  onPriceChange(e) {
    const index = e.detail.value;
    if (index === null || index === undefined) return;
    
    const price = this.data.priceRangeList[index] || '';
    this.setData({
      currentPrice: price,
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  /**
   * 排序筛选
   */
  onSortChange(e) {
    const index = e.detail.value;
    if (index === null || index === undefined) return;
    
    const sort = this.data.sortList[index] || '';
    this.setData({
      currentSort: sort,
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  /**
   * 跳转到酒店详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '酒店ID异常', icon: 'none' });
      return;
    }
    // 增加跳转错误捕获
    try {
      wx.navigateTo({
        url: `/pages/住/hotelDetail/hotelDetail?id=${id}`
      });
    } catch (err) {
      console.error('跳转酒店详情失败：', err);
      wx.showToast({ title: '页面跳转失败', icon: 'none' });
      // 兜底跳转
      wx.redirectTo({
        url: `/pages/住/hotelDetail/hotelDetail?id=${id}`
      });
    }
  },

  // 伪TabBar切换方法
  switchTab(e) {
    const tabKey = e.currentTarget.dataset.tab;
    if (tabKey === this.data.activeTab) return;

    this.setData({ activeTab: tabKey });

    const tabPathMap = {
      hotel: '/pages/住/hotelList/hotelList',
      order: '/pages/住/hotel_user/orderList/orderList',
      collect: '/pages/住/hotel_user/collectList/collectList',
      mine: '/pages/住/hotel_user/personalCenter/personalCenter'
    };

    try {
      if (tabKey === 'hotel') {
        wx.switchTab({ url: tabPathMap[tabKey] });
      } else {
        wx.navigateTo({ url: tabPathMap[tabKey] });
      }
    } catch (err) {
      console.error('Tab切换失败：', err);
      wx.showToast({ title: '页面跳转失败', icon: 'none' });
    }
  }
});