// pages/食/食.js
Page({
  /**
   * 页面初始数据
   */
  data: {
    pageLoading: false, // 全局页面加载状态
    loadingMore: false, // 上拉加载更多状态
    noMoreData: false,  // 是否无更多数据
    clickLock: false,   // 防止按钮重复点击锁
    // 新增：附近餐厅完整数据（包含原有+新增餐厅）
    restaurantList: [
      {
        id: 1,
        name: "老味火锅",
        desc: "传承百年的经典口味，麻辣鲜香。",
        tags: "火锅、聚餐",
        score: 4.8,
        img: "/images/restaurant/laowei.jpg"
      },
      {
        id: 2,
        name: "江南小厨",
        desc: "精致江浙菜，环境优雅。",
        tags: "中餐、清淡",
        score: 4.7,
        img: "/images/restaurant/jiangnan.jpg"
      },
      {
        id: 3,
        name: "健康轻食",
        desc: "低脂低卡，健康美味。",
        tags: "轻食、外卖",
        score: 4.6,
        img: "/images/restaurant/healthy.jpg"
      },
      // 新增餐厅1
      {
        id: 4,
        name: "街角西餐厅",
        desc: "正宗法式牛排，现烤手工面包。",
        tags: "西餐、约会",
        score: 4.9,
        img: "/images/restaurant/western.jpg"
      },
      // 新增餐厅2
      {
        id: 5,
        name: "夜烤天下",
        desc: "炭火现烤，秘制酱料，夜宵首选。",
        tags: "烧烤、夜宵",
        score: 4.5,
        img: "/images/restaurant/bbq.jpg"
      },
      // 新增餐厅3
      {
        id: 6,
        name: "和风日料",
        desc: "新鲜刺身，现捏寿司，日式氛围。",
        tags: "日料、刺身",
        score: 4.8,
        img: "/images/restaurant/japanese.jpg"
      },
      // 新增餐厅4
      {
        id: 7,
        name: "川湘小馆",
        desc: "地道川湘味，辣度可选，性价比高。",
        tags: "川菜、湘菜",
        score: 4.4,
        img: "/images/restaurant/chuanxiang.jpg"
      },
      // 新增餐厅5
      {
        id: 8,
        name: "粤式茶餐厅",
        desc: "经典港式奶茶，叉烧饭，菠萝油。",
        tags: "粤菜、茶点",
        score: 4.7,
        img: "/images/restaurant/cantonese.jpg"
      }
    ]
  },
  loadCount: 0, // 加载次数统计（替代static，小程序兼容写法）

  /**
   * 生命周期--页面加载
   */
  onLoad(options) {
    // 显示页面加载中
    this.setData({ pageLoading: true });
    // 模拟初始化数据请求
    this.initData().finally(() => {
      this.setData({ pageLoading: false });
    });
  },

  /**
   * 生命周期--页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期--页面显示
   */
  onShow() {
    // 页面重新显示时重置加载状态
    this.setData({
      loadingMore: false,
      noMoreData: false
    });
    this.loadCount = 0; // 重置加载次数
  },

  /**
   * 生命周期--页面隐藏
   */
  onHide() {
    // 取消未完成的请求，避免无效请求
    if (this.requestTask) {
      this.requestTask.abort();
    }
  },

  /**
   * 生命周期--页面卸载
   */
  onUnload() {
    this.setData({ clickLock: false }); // 解锁点击
  },

  /**
   * 下拉刷新事件
   */
  onPullDownRefresh() {
    this.setData({ pageLoading: true });
    this.refreshData().finally(() => {
      this.setData({ pageLoading: false });
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
    });
  },

  /**
   * 上拉触底加载更多
   */
  onReachBottom() {
    // 防止重复加载、无数据时不再触发
    if (this.data.loadingMore || this.data.noMoreData) return;
    this.setData({ loadingMore: true });
    this.loadMoreData().finally(() => {
      this.setData({ loadingMore: false });
    });
  },

  /**
   * 自定义分享
   */
  onShareAppMessage() {
    return {
      title: '餐饮与食品 - 吃得安心，选得省心',
      path: '/pages/食/食', // 保留原中文路径
      imageUrl: '/images/food-share.png' // 可替换为自己的分享图路径
    };
  },

  /**
   * 功能项点击事件
   */
  handleTap(e) {
    // 防重复点击
    if (this.data.clickLock) return;
    this.setData({ clickLock: true });

    // 获取点击的功能key
    const key = e.currentTarget.dataset.key;
    if (key === 'restaurant') {
      // 点击附近餐厅：跳转到餐厅列表页并传递完整数据
      wx.navigateTo({
        url: '/pages/common/list/list?title=附近餐厅&type=restaurant',
        success: (res) => {
          // 向列表页传递餐厅数据
          res.eventChannel.emit('acceptRestaurantData', {
            list: this.data.restaurantList
          });
          this.setData({ clickLock: false });
        },
        fail: () => this.setData({ clickLock: false })
      });
      return;
    }

    // 其他功能路由映射
    const funcMap = {
      delivery: { page: 'form', title: '外卖订餐', type: 'delivery' },
      grocery: { page: 'list', title: '食材采购', type: 'grocery' },
      safety: { page: 'detail', title: '食品安全提示', type: 'safety' }
    };

    const target = funcMap[key];
    if (target) {
      // 跳转到对应功能页
      wx.navigateTo({
        url: `/pages/common/${target.page}/${target.page}?title=${target.title}&type=${target.type}`,
        success: () => this.setData({ clickLock: false }),
        fail: () => this.setData({ clickLock: false })
      });
    } else {
      // 功能未接入提示
      wx.showToast({ title: '该功能暂未接入', icon: 'none', duration: 1500 });
      setTimeout(() => this.setData({ clickLock: false }), 1500);
    }
  },

  /**
   * 初始化数据（模拟接口请求，可替换为真实接口）
   */
  initData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 真实开发时替换为wx.request请求
        resolve();
      }, 800);
    });
  },

  /**
   * 刷新数据（模拟接口请求，可替换为真实接口）
   */
  refreshData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 });
        // 真实开发时替换为wx.request请求，更新页面数据
        resolve();
      }, 1000);
    });
  },

  /**
   * 加载更多数据（模拟接口请求，可替换为真实接口）
   */
  loadMoreData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.loadCount++;
        // 模拟加载3次后无更多数据
        if (this.loadCount >= 3) {
          this.setData({ noMoreData: true });
        }
        // 真实开发时替换为wx.request请求，追加页面数据
        resolve();
      }, 1000);
    });
  }
});