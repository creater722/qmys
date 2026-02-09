Page({
  data: {
    hotelList: [],        // 酒店列表
    isLoading: false,     // 加载中
    hasMore: true,        // 有更多数据
    pageNum: 1,           // 当前页码
    pageSize: 10,         // 每页条数

    // 筛选条件
    searchKey: '',        // 搜索关键词
    currentCity: '',      // 当前选中城市
    currentStar: '',      // 当前选中星级
    currentPrice: '',     // 当前选中价格区间
    currentSort: '',      // 当前选中排序

    // 筛选数据源
    cityList: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
    starList: ['1星', '2星', '3星', '4星', '5星'],
    priceRangeList: ['0-200元', '200-500元', '500-1000元', '1000元以上'],
    sortList: ['价格从低到高', '价格从高到低', '评分从高到低']
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
   * 加载酒店列表
   */
  loadHotelList(callback) {
    if (this.data.isLoading || !this.data.hasMore) return;

    this.setData({ isLoading: true });

    // 构建筛选参数
    const params = {
      pageNum: this.data.pageNum,
      pageSize: this.data.pageSize,
      keyword: this.data.searchKey
    };

    // 城市筛选
    if (this.data.currentCity) params.city = this.data.currentCity;
    // 星级筛选
    if (this.data.currentStar) params.starRating = this.data.currentStar.replace('星', '');
    // 价格筛选
    if (this.data.currentPrice) {
      const priceRange = this.data.currentPrice.split('-');
      if (priceRange[0] === '0') {
        params.minPrice = 0;
        params.maxPrice = 200;
      } else if (priceRange[0] === '200') {
        params.minPrice = 200;
        params.maxPrice = 500;
      } else if (priceRange[0] === '500') {
        params.minPrice = 500;
        params.maxPrice = 1000;
      } else {
        params.minPrice = 1000;
      }
    }
    // 排序筛选
    if (this.data.currentSort) {
      if (this.data.currentSort === '价格从低到高') params.sort = 'minPrice_asc';
      if (this.data.currentSort === '价格从高到低') params.sort = 'minPrice_desc';
      if (this.data.currentSort === '评分从高到低') params.sort = 'rating_desc';
    }

    // 调用后端接口
    wx.request({
      url: 'http://localhost:3000/api/hotels',
      method: 'GET',
      data: params,
      success: (res) => {
        // 新增：打印完整返回数据，方便排查
        console.log('酒店接口返回数据：', res.data);
        
        if (res.data.code === 200) {
          const newList = res.data.data.list || [];
          // 新增：打印实际拿到的列表数据
          console.log('解析后的酒店列表：', newList);
          
          const hotelList = this.data.pageNum === 1 
            ? newList 
            : [...this.data.hotelList, ...newList];
      
          this.setData({
            hotelList,
            hasMore: newList.length === this.data.pageSize,
            pageNum: this.data.pageNum + 1
          });
          
          // 新增：空数据提示
          if (this.data.pageNum === 2 && newList.length === 0) {
            wx.showToast({ title: '暂无符合条件的酒店', icon: 'none' });
          }
        } else {
          // 新增：处理后端返回的错误信息
          wx.showToast({ title: res.data.message || '获取数据失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ isLoading: false });
        callback && callback();
      }
    });
  },

  /**
   * 加载更多
   */
  loadMore() {
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

  /**
   * 城市筛选
   */
  onCityChange(e) {
    const city = this.data.cityList[e.detail.value];
    this.setData({
      currentCity: city,
      pageNum: 1,
      hotelList: [],
      hasMore: true
    });
    this.loadHotelList();
  },

  /**
   * 星级筛选
   */
  onStarChange(e) {
    const star = this.data.starList[e.detail.value];
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
    const price = this.data.priceRangeList[e.detail.value];
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
    const sort = this.data.sortList[e.detail.value];
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
    wx.navigateTo({
      url: `/pages/住/hotelDetail/hotelDetail?id=${id}`
    });
  }
});