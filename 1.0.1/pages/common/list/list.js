Page({
  data: {
    title: '列表',
    type: '',
    list: [],
    isLoading: true,
    emptyText: '暂无相关信息',
    showIntro: false,
    currentRestaurant: {},
    // 滚动效果相关变量
    navBg: '#FFF', 
    navOpacity: 1, 
    scrollTop: 0,
    // 【新增】分类相关变量
    categories: [
      { id: 'all', name: '全部' },
      { id: 'hotpot', name: '火锅' },
      { id: 'chinese', name: '中餐' },
      { id: 'light', name: '轻食' },
      { id: 'cantonese', name: '粤菜' },
      { id: 'japanese', name: '日料' },
      { id: 'bbq', name: '烧烤' },
      { id: 'milktea', name: '奶茶' },
      { id: 'sichuan', name: '川菜' },
      { id: 'western', name: '西餐' },
      { id: 'southeast', name: '东南亚菜' },
      { id: 'homecook', name: '家常菜' }
    ],
    activeCategory: 'all', // 默认选中全部
    filteredList: [] // 筛选后的列表
  },

  onLoad(options) {
    const { title, type } = options
    this.setData({ 
      title: title || '列表',
      type: type || ''
    })
    this.setEmptyText(type)
    this.loadData(type)
  },

  // 页面滚动监听事件
  onPageScroll(e) {
    const scrollTop = e.detail.scrollTop;
    let navOpacity = 1;
    let navBg = '#FFF';
    if (scrollTop > 50) {
      navOpacity = Math.max(0.8, 1 - scrollTop / 200);
      navBg = '#f9f9f9';
    }
    this.setData({
      scrollTop,
      navOpacity,
      navBg
    });
  },

  onPullDownRefresh() {
    this.loadData(this.data.type, true)
  },

  setEmptyText(type) {
    const emptyTextMap = {
      hospital: '暂无医院信息',
      restaurant: '暂无餐厅信息',
      hotel: '暂无酒店信息',
      rent: '暂无租房信息',
      transit: '暂无交通信息',
      supermarket: '暂无超市信息',
      grocery: '暂无生鲜信息',
      shared: '暂无共享出行信息',
      drive: '暂无路线信息'
    }
    this.setData({
      emptyText: emptyTextMap[type] || '暂无相关信息'
    })
  },

  loadData(type, isRefresh = false) {
    if (!isRefresh) {
      this.setData({ isLoading: true })
    }
    setTimeout(() => {
      try {
        let list = []
        const mockImages = {
          hospital: 'https://images.unsplash.com/photo-1587351021759-3e566b9af953?w=200',
          restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
          hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
          transit: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200',
          shop: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=200'
        }
        switch(type) {
          case 'hospital':
            list = [
              { id: 1, title: '市第一人民医院', desc: '综合性三级甲等医院，提供全科医疗服务。', tags: ['三甲', '综合', '24小时'], image: mockImages.hospital },
              { id: 2, title: '儿童医院', desc: '专注于儿童疾病的预防与治疗。', tags: ['专科', '儿科'], image: mockImages.hospital },
              { id: 3, title: '社区卫生服务中心', desc: '为您提供便捷的社区医疗与疫苗接种服务。', tags: ['社区', '便民'], image: mockImages.hospital }
            ]
            break;
          case 'restaurant':
            // 【新增】给每个餐厅添加category字段，用于分类筛选
            list = [
              { 
                id: 1, 
                title: '老味火锅', 
                desc: '传承百年的经典口味，麻辣鲜香。', 
                tags: ['火锅', '聚餐', '4.8分'], 
                image: mockImages.restaurant,
                category: 'hotpot', // 火锅类
                detailDesc: '老味火锅拥有百年配方，锅底选用数十种香料炒制，麻辣鲜香层次丰富，食材新鲜每日现采，毛肚、鸭肠脆嫩爽口，店内环境复古有格调，适合朋友聚餐、家庭团圆，提供免费酸梅汤和小吃。',
                address: 'XX区解放大道156号（近人民广场）',
                businessTime: '10:30-23:00'
              },
              { 
                id: 2, 
                title: '江南小厨', 
                desc: '精致江浙菜，环境优雅。', 
                tags: ['中餐', '清淡', '4.9分'], 
                image: mockImages.restaurant,
                category: 'chinese', // 中餐类
                detailDesc: '江南小厨主打精致江浙菜，食材均来自江浙本地，刀工精细、摆盘讲究，招牌菜有松鼠鳜鱼、龙井虾仁、东坡肉，口味清淡鲜美，店内装修江南水乡风格，安静雅致，适合商务宴请、情侣约会。',
                address: 'XX区西湖路88号（西湖公园旁）',
                businessTime: '11:00-14:00 17:00-22:00'
              },
              { 
                id: 3, 
                title: '健康轻食', 
                desc: '低脂低卡，健康美味。', 
                tags: ['轻食', '外卖', '4.5分'], 
                image: mockImages.restaurant,
                category: 'light', // 轻食类
                detailDesc: '健康轻食专注低脂低卡餐品，食材选用有机蔬菜、优质蛋白，无添加蔗糖和油炸工艺，招牌有鸡胸肉沙拉、藜麦碗、全麦三明治，搭配自制低脂酱料，适合健身人群、减脂人士，支持外卖配送，30分钟达。',
                address: 'XX区健身路32号（健身中心楼下）',
                businessTime: '08:00-20:00'
              },
              { 
                id: 4, 
                title: '粤味轩', 
                desc: '正宗广式茶点，现点现蒸。', 
                tags: ['粤菜', '早茶', '4.7分'], 
                image: mockImages.restaurant,
                category: 'cantonese', // 粤菜类
                detailDesc: '粤味轩由广东主厨坐镇，茶点现点现蒸，皮薄馅大，虾饺皇饱满弹牙，烧卖鲜香多汁，流沙包咸甜适中，搭配正宗港式奶茶，店内环境充满广式风情，早茶时段人气火爆，支持扫码点单。',
                address: 'XX区粤华路66号（粤华商业城2楼）',
                businessTime: '07:00-15:00 17:00-21:00'
              },
              { 
                id: 5, 
                title: '和风寿司', 
                desc: '新鲜刺身，手工捏制寿司。', 
                tags: ['日料', '寿司', '4.8分'], 
                image: mockImages.restaurant,
                category: 'japanese', // 日料类
                detailDesc: '和风寿司的刺身每日空运到店，保证新鲜度，寿司由十年经验师傅手工捏制，米饭软硬适中，醋味刚好，招牌有三文鱼刺身、北极贝寿司、鳗鱼饭，店内装修日式简约，有独立包厢，适合朋友小聚。',
                address: 'XX区樱花路128号（日式风情街内）',
                businessTime: '11:00-22:30'
              },
              { 
                id: 6, 
                title: '烈火烧烤', 
                desc: '现烤现卖，滋滋冒香，夜宵首选。', 
                tags: ['烧烤', '夜宵', '4.6分'], 
                image: mockImages.restaurant,
                category: 'bbq', // 烧烤类
                detailDesc: '烈火烧烤主打川式炭火烧烤，食材每日现穿现烤，招牌烤五花肉、烤鸡翅、烤茄子外焦里嫩，撒上秘制干碟料香十足，搭配冰镇啤酒、酸梅汤超解腻，店内烟火气十足，是夜宵、朋友小聚的宝藏店铺，营业至凌晨。',
                address: 'XX区夜市街88号（老火车站旁）',
                businessTime: '16:00-02:00'
              },
              { 
                id: 7, 
                title: '茶颜小筑', 
                desc: '国风奶茶，鲜茶现泡，颜值口感双在线。', 
                tags: ['奶茶', '甜品', '4.9分'], 
                image: mockImages.restaurant,
                category: 'milktea', // 奶茶类
                detailDesc: '茶颜小筑主打新中式国风奶茶，所有茶底均为鲜茶现泡，拒绝茶粉勾兑，招牌幽兰拿铁、声声乌龙、桂花弄，奶油顶撒上碧根果，口感丰富，杯身国风设计颜值超高，店内装修古色古香，适合打卡拍照，支持小程序点单免排队。',
                address: 'XX区步行街126号（银泰商场1楼）',
                businessTime: '09:30-23:30'
              },
              { 
                id: 8, 
                title: '川味阁', 
                desc: '正宗川味，麻辣过瘾，重口味最爱。', 
                tags: ['川菜', '麻辣', '4.7分'], 
                image: mockImages.restaurant,
                category: 'sichuan', // 川菜类
                detailDesc: '川味阁主厨来自四川成都，精通正宗川味烹饪，招牌水煮鱼、麻婆豆腐、辣子鸡、夫妻肺片，麻辣鲜香、重油重味，完全还原川渝风味，食材中的辣椒、花椒均从四川空运，店内环境江湖风，分量超大，性价比超高，适合重口味爱好者。',
                address: 'XX区武侯路66号（四川大厦旁）',
                businessTime: '11:00-14:30 17:00-22:30'
              },
              { 
                id: 9, 
                title: '芝萨利都', 
                desc: '手工薄底披萨，芝士拉丝，现烤现吃。', 
                tags: ['西餐', '披萨', '4.6分'], 
                image: mockImages.restaurant,
                category: 'western', // 西餐类
                detailDesc: '芝萨利都主打手工薄底披萨，饼底现揉现烤，酥脆有嚼劲，芝士选用进口马苏里拉，拉丝超长，招牌超级至尊、榴莲忘返、培根蘑菇披萨，配料超足，还提供意面、焗饭、小吃拼盘，店内装修简约休闲，适合亲子、朋友聚餐，支持外卖。',
                address: 'XX区万达金街32号（万达广场2号门旁）',
                businessTime: '10:00-22:00'
              },
              { 
                id: 10, 
                title: '南洋小馆', 
                desc: '地道东南亚菜，冬阴功汤正宗。', 
                tags: ['东南亚菜', '泰式', '4.8分'], 
                image: mockImages.restaurant,
                category: 'southeast', // 东南亚菜类
                detailDesc: '南洋小馆主打泰国、越南地道东南亚菜，主厨曾在泰国学艺多年，招牌冬阴功汤酸辣开胃、椰香浓郁，菠萝炒饭、咖喱牛腩、青木瓜沙拉口感正宗，食材中的香茅、青柠、咖喱均为进口，店内装修热带风情，仿佛置身东南亚，适合情侣约会、闺蜜小聚。',
                address: 'XX区东盟街88号（东南亚风情园旁）',
                businessTime: '11:30-14:00 17:30-22:00'
              },
              { 
                id: 11, 
                title: '北方饺子馆', 
                desc: '手工现包，皮薄馅大，北方风味。', 
                tags: ['饺子', '家常菜', '4.5分'], 
                image: mockImages.restaurant,
                category: 'homecook', // 家常菜类
                detailDesc: '北方饺子馆由东北师傅主理，所有饺子均为手工现包，皮薄馅大、汤汁浓郁，招牌韭菜鸡蛋、猪肉大葱、鲅鱼水饺，口味正宗北方风味，还提供东北大拉皮、锅包肉、地三鲜等家常菜，分量超大，性价比超高，适合家庭用餐、打工人干饭。',
                address: 'XX区东北路56号（理工大学北门斜对面）',
                businessTime: '09:00-21:30'
              }
            ]
            break;
          case 'hotel':
            list = [
              { id: 1, title: '悦享酒店', desc: '市中心高端商务酒店，出行便利。', tags: ['豪华', '商务'], image: mockImages.hotel },
              { id: 2, title: '温馨民宿', desc: '体验当地风情，像家一样的感觉。', tags: ['民宿', '特色'], image: mockImages.hotel }
            ]
            break;
          case 'rent':
            list = [
              { id: 1, title: '阳光小区 两室一厅', desc: '精装修，拎包入住，近地铁。', tags: ['整租', '近地铁'], image: mockImages.hotel },
              { id: 2, title: '青年公寓 单间', desc: '押一付一，年轻人社区。', tags: ['合租', '公寓'], image: mockImages.hotel }
            ]
            break;
          case 'transit':
            list = [
              { id: 1, title: '1号线', desc: '火车站 - 机场，首班 06:00 末班 23:00', tags: ['地铁', '准点'], image: mockImages.transit },
              { id: 2, title: '302路公交', desc: '市中心环线，途径主要商圈。', tags: ['公交', '空调'], image: mockImages.transit }
            ]
            break;
          case 'supermarket':
            list = [
              { id: 1, title: '家乐福超市', desc: '大型综合超市，生鲜日用一应俱全。', tags: ['超市', '连锁'], image: mockImages.shop },
              { id: 2, title: '便利蜂', desc: '24小时便利店，随时为您服务。', tags: ['便利店', '24h'], image: mockImages.shop }
            ]
            break;
           case 'grocery':
            list = [
              { id: 1, title: '生鲜市场', desc: '每日新鲜蔬菜水果，价格实惠。', tags: ['菜场', '新鲜'], image: mockImages.shop },
              { id: 2, title: '进口食品店', desc: '汇聚全球美食，品质保证。', tags: ['进口', '零食'], image: mockImages.shop }
            ]
            break;
          case 'shared':
            list = [
              { id: 1, title: '青桔单车', desc: '附近 100米 有 5 辆车可用。', tags: ['单车', '便捷'], image: mockImages.transit },
              { id: 2, title: '联动云共享汽车', desc: 'SUV 车型，距离您 500米。', tags: ['汽车', '自驾'], image: mockImages.transit }
            ]
            break;
          case 'drive':
            list = [
              { id: 1, title: '推荐路线', desc: '耗时最短，约 25 分钟，途径高架。', tags: ['最快', '畅通'], image: mockImages.transit },
              { id: 2, title: '备选路线', desc: '距离最短，约 30 分钟，红绿灯较多。', tags: ['较近'], image: mockImages.transit }
            ]
            break;
          default:
            list = [
              { id: 1, title: '示例项目 1', desc: '这是一个通用列表项示例。', tags: ['标签1', '标签2'] },
              { id: 2, title: '示例项目 2', desc: '这是另一个通用列表项示例。', tags: ['标签A'] }
            ]
        }
        this.setData({ 
          list, 
          isLoading: false,
          filteredList: list // 初始化筛选列表为全部
        })
        // 仅餐厅板块初始化分类筛选
        if (type === 'restaurant') {
          this.filterRestaurants('all');
        }
        if (isRefresh) {
          wx.stopPullDownRefresh()
        }
      } catch (error) {
        console.error('加载数据失败：', error)
        this.setData({ isLoading: false, list: [], filteredList: [] })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
        if (isRefresh) {
          wx.stopPullDownRefresh()
        }
      }
    }, 800)
  },

  // 【新增】分类筛选方法
  filterRestaurants(categoryId) {
    let filteredList = [];
    if (categoryId === 'all') {
      filteredList = this.data.list; // 全部餐厅
    } else {
      // 根据category字段筛选
      filteredList = this.data.list.filter(item => item.category === categoryId);
    }
    this.setData({
      activeCategory: categoryId,
      filteredList
    });
  },

  // 【新增】点击分类标签事件
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.filterRestaurants(categoryId);
  },

  showRestaurantIntro(e) {
    const currentRestaurant = e.currentTarget.dataset.item;
    this.setData({
      showIntro: true,
      currentRestaurant
    });
  },

  closeIntro() {
    this.setData({
      showIntro: false,
      currentRestaurant: {}
    });
  },

  stopPropagation() {},

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    const { type } = this.data
    if (type !== 'restaurant') {
      wx.navigateTo({
        url: `/pages/common/detail/detail?title=详情&type=${type}&id=${id}`
      })
    }
  }
})