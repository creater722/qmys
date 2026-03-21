Page({
  data: {
    title: '列表',
    type: '',
    list: []
  },
  onLoad(options) {
    const { title, type } = options
    this.setData({ 
      title: title || '列表',
      type: type || ''
    })
    this.loadData(type)
  },
  loadData(type) {
    // 模拟数据
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
        list = [
          { id: 1, title: '老味火锅', desc: '传承百年的经典口味，麻辣鲜香。', tags: ['火锅', '聚餐', '4.8分'], image: mockImages.restaurant },
          { id: 2, title: '江南小厨', desc: '精致江浙菜，环境优雅。', tags: ['中餐', '清淡'], image: mockImages.restaurant },
          { id: 3, title: '健康轻食', desc: '低脂低卡，健康美味。', tags: ['轻食', '外卖'], image: mockImages.restaurant }
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
    this.setData({ list })
  },
  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    // 这里可以跳转到详情页，简单起见先弹窗
    // wx.showToast({ title: `点击了项目 ${id}`, icon: 'none' })
    wx.navigateTo({
      url: `/pages/common/detail/detail?title=详情&type=article&id=${id}`
    })
  }
})