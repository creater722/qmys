import { get } from '../../../utils/request';

Page({
  data: {
    detail: null, // 房源详情数据
    isLoading: true,
    // 枚举值中文映射（适配模型的英文枚举）
    rentTypeMap: {
      whole: '整租',
      shared: '合租',
      short_term: '短租'
    },
    propertyTypeMap: {
      apartment: '公寓',
      house: '住宅',
      villa: '别墅',
      dorm: '宿舍'
    },
    statusMap: {
      available: '可租',
      reserved: '已预约',
      rented: '已租',
      offline: '已下架'
    }
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '房源ID不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    // 加载房源详情
    this.getRentalDetail(id);
  },

  // 获取房源详情（适配模型的驼峰字段）
  async getRentalDetail(id) {
    this.setData({ isLoading: true });
    try {
      const res = await get(`/api/rentals/detail/${id}`);
      if (res.code === 200) {
        // 处理JSON字段（如facilities配置）
        const detail = res.data;
        if (detail.facilities && typeof detail.facilities === 'string') {
          detail.facilities = JSON.parse(detail.facilities); // 转数组
        }
        this.setData({ detail });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 拨打电话（房东电话）
  callLandlord() {
    const { landlordPhone } = this.data.detail;
    if (!landlordPhone) {
      wx.showToast({ title: '暂无房东电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: landlordPhone,
      fail: () => wx.showToast({ title: '拨打电话失败', icon: 'none' })
    });
  },

  // 收藏房源（示例逻辑）
  collectHouse() {
    wx.showToast({ title: '收藏功能待开发', icon: 'none' });
  },

  // 预约看房（示例逻辑）
  bookViewing() {
    wx.showToast({ title: '预约功能待开发', icon: 'none' });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});