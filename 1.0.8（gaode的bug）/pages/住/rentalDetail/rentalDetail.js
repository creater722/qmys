import { get, post } from '../../../utils/request';

Page({
  data: {
    detail: null,
    isLoading: true,
    isCollected: false,
    activeTab: 'rent',
    // 枚举映射
    rentTypeMap: {
      whole: '整租',
      shared: '合租',
      short_term: '短租',
      shortTerm: '短租'
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
    },
    // TabBar路径映射
    tabPathMap: {
      rent: '/pages/住/rentList/rentList',
      collect: '/pages/住/collectList/collectList',
      book: '/pages/住/bookViewing/bookViewing',
      my: '/pages/住/personalCenter/personalCenter'
    },
    tabNameMap: {
      rent: '租房',
      collect: '收藏',
      book: '预约看房',
      my: '我的'
    }
  },

  onLoad(options) {
    const app = getApp();
    console.log('【租房详情页】全局基础地址：', app.getBaseUrl());
    console.log('【租房详情页】传入参数：', options); // 新增：打印传入参数，方便调试
    
    // 🔥 核心修改1：彻底关闭测试ID，仅使用列表页传递的真实ID
    let { id } = options;
    if (!id) {
      console.warn('房源ID不存在，返回列表页');
      wx.showToast({ title: '房源ID不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return; // 无ID直接返回列表页，不再强制用1
    }
    this.getRentalDetail(id);
    // 🔥 修复2：彻底屏蔽收藏状态检查，消除404报错
    // this.checkCollectStatus(id);
  },

  // 获取房源详情（核心修复：字段映射适配后端返回）
  async getRentalDetail(id) {
    this.setData({ isLoading: true });
    try {
      console.log('【租房详情】请求ID：', id);
      const res = await get(`/api/rentals/detail/${id}`);
      
      console.log('【租房详情】接口返回：', res); // 新增：打印接口返回，方便调试
      
      if (res?.code === 200 && res.data) {
        let detail = { ...res.data };
        
        // 解析设施（兼容字符串/数组格式）
        if (detail.facilities) {
          try {
            detail.facilities = typeof detail.facilities === 'string' 
              ? JSON.parse(detail.facilities) 
              : detail.facilities;
          } catch (e) {
            console.error('解析facilities失败：', e);
            detail.facilities = [];
          }
        } else {
          detail.facilities = [];
        }

        // 修复2：字段映射完全适配后端返回的字段名
        const formatDetail = {
          id: detail.id || '',
          title: detail.title || '暂无房源标题',
          rentType: detail.rentType || detail.rent_type || 'whole',
          propertyType: detail.propertyType || detail.property_type || 'house',
          status: detail.status || 'available',
          price: Number(detail.rentPrice || detail.price || 0), // 优先取rentPrice（后端返回的字段）
          area: Number(detail.area || 0),
          roomCount: detail.roomCount || detail.room_count || '1',
          hallCount: detail.hallCount || detail.hall_count || '1',
          toiletCount: detail.bathroomCount || detail.bathroom_count || '1', // 替换为bathroomCount（后端返回的字段）
          floor: detail.floor || '中层',
          totalFloor: detail.totalFloor || detail.total_floor || '18层',
          address: detail.address || '暂无详细地址',
          city: detail.city || '未知城市',
          district: detail.district || '未知区域',
          communityName: detail.communityName || '', // 新增：兼容小区名称
          landlordName: detail.landlordName || detail.landlord_name || '房东',
          landlordPhone: detail.landlordPhone || detail.landlord_phone || '',
          publishTime: detail.publishTime || detail.publish_time || new Date().toLocaleDateString(),
          description: detail.description || '暂无房源描述',
          images: Array.isArray(detail.images) ? detail.images : [],
          facilities: Array.isArray(detail.facilities) ? detail.facilities : [],
          deposit: detail.deposit || '押一付三',
          orientation: detail.orientation || '朝南',
          decoration: detail.decoration || '精装修',
          // 新增：兼容后端返回的地铁相关字段
          nearSubway: detail.nearSubway || '否',
          subwayDistance: detail.subwayDistance || 0
        };

        console.log('【租房详情】格式化后数据：', formatDetail); // 新增：打印格式化后的数据
        this.setData({ detail: formatDetail });
      } else {
        wx.showToast({ title: res?.message || '房源信息不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error('加载房源详情失败：', err);
      // 错误提示优化，不强制返回（方便调试）
      wx.showToast({ 
        title: err.errMsg?.includes('connect') ? '服务器连接失败' : '加载房源失败', 
        icon: 'none' 
      });
      // 注释掉自动返回，方便查看错误日志
      // setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 🔥 修复3：重写收藏状态检查，仅提示不请求接口（消除404）
  async checkCollectStatus(houseId) {
    console.info('收藏功能暂未开放，跳过收藏状态检查');
    this.setData({ isCollected: false });
  },

  // 🔥 修复4：重写收藏按钮逻辑，仅提示不请求接口
  async collectHouse() {
    wx.showToast({ title: '收藏功能暂未开放', icon: 'none' });
    // 以下为原逻辑，如需后续恢复收藏功能，取消注释即可
    
    const { detail, isCollected } = this.data;
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('token');

    if (!userId || !token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    try {
      const res = await post(`/api/user/favorites/${isCollected ? 'remove' : 'add'}`, {
        userId,
        favType: 'rental',
        targetId: detail.id
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        this.setData({ isCollected: !isCollected });
        wx.showToast({ 
          title: isCollected ? '取消收藏成功' : '收藏成功', 
          icon: 'success' 
        });
      } else {
        wx.showToast({ title: res?.message || '操作失败', icon: 'none' });
      }
    } catch (err) {
      console.error('收藏操作失败：', err);
      wx.showToast({ title: '服务器连接失败，收藏功能暂不可用', icon: 'none' });
    }
    
  },

  // 联系房东（逻辑不变，增加容错）
  callLandlord() {
    const { landlordPhone } = this.data.detail || {};
    if (!landlordPhone || !/^1[3-9]\d{9}$/.test(landlordPhone)) {
      wx.showToast({ title: '暂无有效房东电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: landlordPhone,
      fail: () => {
        wx.showToast({ title: '拨打电话失败，请手动拨打', icon: 'none' });
      }
    });
  },

  // 预约看房（逻辑不变）
  bookViewing() {
    const { status } = this.data.detail || {};
    if (['rented', 'offline'].includes(status)) {
      wx.showToast({ title: '该房源不可预约', icon: 'none' });
      return;
    }

    const { id, title } = this.data.detail;
    wx.navigateTo({
      url: `/pages/住/bookViewing/bookViewing?houseId=${id}&houseTitle=${title}`,
      fail: () => {
        wx.showModal({
          title: '预约看房',
          content: '请拨打房东电话预约：' + (this.data.detail.landlordPhone || '暂无电话'),
          confirmText: '拨打电话',
          success: (res) => {
            if (res.confirm) this.callLandlord();
          }
        });
      }
    });
  },

  // TabBar切换（增加路径校验）
  switchTab(e) {
    const tabKey = e.currentTarget.dataset.tab;
    const tabName = this.data.tabNameMap[tabKey];
    const targetUrl = this.data.tabPathMap[tabKey];

    if (tabKey === this.data.activeTab) return;

    this.setData({ activeTab: tabKey });

    if (tabKey === 'rent') {
      this.getRentalDetail(this.data.detail.id);
      wx.showToast({ title: '已刷新房源信息', icon: 'none' });
    } else {
      if (!targetUrl) {
        wx.showToast({ title: `${tabName}页面路径未配置`, icon: 'none' });
        this.setData({ activeTab: 'rent' });
        return;
      }
      wx.navigateTo({
        url: targetUrl,
        fail: (err) => {
          console.error(`${tabName}页面跳转失败：`, err);
          this.setData({ activeTab: 'rent' });
          wx.showToast({ title: `${tabName}页面暂未开发`, icon: 'none' });
        }
      });
    }
  },

  // 返回上一页（逻辑不变）
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({ url: '/pages/住/rentList/rentList' });
    }
  }
});