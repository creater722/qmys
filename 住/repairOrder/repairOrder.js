import { post, get } from '../../../utils/request'; // 新增get方法导入

Page({
  data: {
    repairForm: {
      repairType: '', // 故障类型文本（如"水电维修"）
      description: '',
      address: '',
      contactPhone: '' // 可选字段
    },
    isSubmitting: false,
    repairTypeList: ['水电维修', '家电维修', '墙面维修', '门窗维修', '其他故障'],
    // 新增：用于存储当前用户已提交的工单（同步数据库数据）
    myOrders: [],
    isLoadingOrders: false
  },

  onLoad(options) {
    // 自动填充用户手机号（可选）
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (userInfo.phone) {
      this.setData({ 'repairForm.contactPhone': userInfo.phone });
    }

    // 可选：页面加载时查询我的工单（如需展示已提交记录）
    // this.getMyOrders();
  },

  // ========== 新增：返回上一页方法（核心修复） ==========
  goBack() {
    // 优先返回上一页，失败则跳首页兜底
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 替换为你的首页路径（根据实际项目调整）
        wx.redirectTo({
          url: '/pages/住/index' // 示例：住模块的首页，或 '/pages/index/index'
        });
      }
    });
  },

  // 新增：查询我的工单（从数据库同步）
  async getMyOrders() {
    this.setData({ isLoadingOrders: true });
    try {
      // 获取当前用户ID（从缓存/Token中取，测试环境默认传1）
      const userInfo = wx.getStorageSync('userInfo') || {};
      const userId = userInfo.id || 1;

      // 调用后端查询接口
      const res = await get('/api/repair/orders', {
        page: 1,
        pageSize: 10,
        userId // 传给后端筛选当前用户的工单
      });

      if (res.code === 200) {
        this.setData({ myOrders: res.data.list || [] });
      }
    } catch (err) {
      const errMsg = err?.data?.message || err.message || '查询工单失败';
      wx.showToast({ title: errMsg, icon: 'none' });
    } finally {
      this.setData({ isLoadingOrders: false });
    }
  },

  // 输入框/选择器绑定（保留原有逻辑）
  onInputChange(e) {
    const { key } = e.currentTarget.dataset;
    let value = e.detail.value;

    // 故障类型选择器：索引转文本
    if (key === 'repairType') {
      value = this.data.repairTypeList[value] || '';
    } else {
      value = value.trim(); // 其他字段去空格
    }

    // 手机号仅保留数字
    if (key === 'contactPhone') {
      value = value.replace(/\D/g, '');
    }

    this.setData({ [`repairForm.${key}`]: value });
  },

  // 提交工单（优化：适配后端真实响应，新增同步查询）
  async onSubmit() {
    if (this.data.isSubmitting) return;
    const { repairForm } = this.data;

    // 前端预校验（保留原有逻辑）
    if (!repairForm.repairType) {
      wx.showToast({ title: '请选择故障类型', icon: 'none' });
      return;
    }
    if (!repairForm.description || repairForm.description.length < 2) {
      wx.showToast({ title: '故障描述不能少于2个字', icon: 'none' });
      return;
    }
    if (!repairForm.address || repairForm.address.length < 5) {
      wx.showToast({ title: '维修地址不能少于5个字', icon: 'none' });
      return;
    }
    // 手机号可选，仅填写时校验格式
    if (repairForm.contactPhone && !/^1[3-9]\d{9}$/.test(repairForm.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    try {
      // 提交数据：仅传前端填写的字段，无需传userId
      const submitData = {
        repairType: repairForm.repairType,
        description: repairForm.description,
        address: repairForm.address,
        // 可选字段：有值才传
        ...(repairForm.contactPhone ? { contactPhone: repairForm.contactPhone } : {})
      };

      // 调用后端真实写入数据库的接口
      const res = await post('/api/repair/orders', submitData);
      wx.showToast({ title: res.message || '提交成功', icon: 'success' });
      
      // 提交成功后：刷新我的工单（同步数据库最新数据）
      this.getMyOrders();

      // 提交成功后返回上一页（保留原有逻辑）
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    } catch (err) {
      const errMsg = err?.data?.message || err.message || '提交失败';
      wx.showToast({ title: errMsg, icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});