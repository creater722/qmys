import { post, get } from '../../../utils/request';

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
    isLoadingOrders: false,
    
    // ========== 伪TabBar核心配置（最终版） ==========
    activeTab: 'repair', // 默认选中「维修报修」Tab
    // Tab映射配置：指向新创建的页面
    tabPathMap: {
      repair: '/pages/住/repairOrder/repairOrder',     // 维修报修（当前页）
      myRepair: '/pages/住/myRepair/myRepair',         // 我的维修（新页面）
      master: '/pages/住/masterRepair/masterRepair'    // 我是师傅（新页面）
    },
    // 新增：Tab名称映射（用于友好提示）
    tabNameMap: {
      repair: '维修报修',
      myRepair: '我的维修',
      master: '我是师傅'
    }
  },

  onLoad(options) {
    // 调试：打印全局基础地址
    const app = getApp();
    console.log('【维修报修页】全局基础地址：', app.getBaseUrl());
    
    // 登录态校验
    this.checkLoginStatus();
    
    // 自动填充用户信息
    this.fillUserInfo();

    // 页面加载时查询我的工单
    this.getMyOrders();
  },

  /**
   * 登录态校验（核心）
   */
  checkLoginStatus() {
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('token');
    if (!userId || !token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后提交维修工单',
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: '/pages/login/login' });
        }
      });
    }
  },

  /**
   * 自动填充用户信息
   */
  fillUserInfo() {
    try {
      const phone = wx.getStorageSync('phone') || '';
      const address = wx.getStorageSync('userAddress') || '';
      
      const formData = {};
      if (phone) formData.contactPhone = phone;
      if (address) formData.address = address;
      
      this.setData({ 
        'repairForm.contactPhone': formData.contactPhone || '',
        'repairForm.address': formData.address || ''
      });
    } catch (err) {
      console.error('填充用户信息失败：', err);
    }
  },

  // 返回上一页方法（修复：路径错误 /pages/住/index/index → /pages/住/住）
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.redirectTo({ url: '/pages/住/住' }); // 修复：指向正确的住模块首页
        }
      });
    } else {
      wx.redirectTo({ url: '/pages/住/住' }); // 修复：指向正确的住模块首页
    }
  },

  // 查询我的工单（从数据库同步 + 数据格式化）
  async getMyOrders() {
    this.setData({ isLoadingOrders: true });
    try {
      // 获取当前用户ID（强制用实际登录的ID，兜底22）
      const userId = wx.getStorageSync('userId') || 22;
      const token = wx.getStorageSync('token') || '';

      // 调用后端查询接口（适配全局基础地址）
      const res = await get('/api/repair/orders', {
        page: 1,
        pageSize: 10,
        userId
      }, {
        // 携带token请求头
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        // 数据格式化：适配后端返回的字段（orderId/orderNo等）
        const formatOrders = (res.data?.list || []).map(item => ({
          orderId: item.orderId || item.id || '', // 兼容orderId/id字段
          orderNo: item.orderNo || `RP${Date.now()}`, // 工单编号兜底
          repairType: item.repairType || item.repair_type || '其他故障',
          description: item.description || '暂无描述',
          address: item.address || '暂无地址',
          contactPhone: item.contactPhone || item.contact_phone || '暂无电话',
          status: item.status || 'submitted', // submitted/processing/completed/canceled
          statusText: this.getStatusText(item.status),
          createTime: item.createTime || item.create_time || new Date().toLocaleDateString(),
          updateTime: item.updateTime || item.update_time || ''
        }));
        
        this.setData({ myOrders: formatOrders });
        
        // 无工单提示（仅首次加载时显示）
        if (formatOrders.length === 0 && !this.data.isFirstLoad) {
          wx.showToast({ title: '暂无维修工单', icon: 'none', duration: 1500 });
        }
      } else {
        wx.showToast({ title: res?.message || '查询工单失败', icon: 'none' });
      }
    } catch (err) {
      console.error('查询工单失败详情：', err);
      const errMsg = err.errMsg || '服务器连接失败';
      wx.showToast({ 
        title: errMsg.includes('connect') ? '服务器连接失败' : '查询工单失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ isLoadingOrders: false });
    }
  },

  /**
   * 工单状态文本映射
   */
  getStatusText(status) {
    const statusMap = {
      submitted: '待处理',
      processing: '处理中',
      completed: '已完成',
      canceled: '已取消',
      pending: '待处理' // 兼容旧状态值
    };
    return statusMap[status] || '待处理';
  },

  // 输入框/选择器绑定（增强）
  onInputChange(e) {
    const { key } = e.currentTarget.dataset;
    let value = e.detail.value;

    // 故障类型选择器：索引转文本
    if (key === 'repairType') {
      value = this.data.repairTypeList[value] || '';
    } else {
      value = value.trim(); // 其他字段去空格
    }

    // 手机号仅保留数字，且限制长度
    if (key === 'contactPhone') {
      value = value.replace(/\D/g, '').substring(0, 11);
    }

    // 故障描述限制最大长度
    if (key === 'description') {
      value = value.substring(0, 500); // 限制500字以内
    }

    this.setData({ [`repairForm.${key}`]: value });
  },

  // 提交工单（优化：适配后端真实响应 + 登录态校验）
  async onSubmit() {
    // 防重复提交
    if (this.data.isSubmitting) return;
    
    // 再次校验登录态
    const userId = wx.getStorageSync('userId');
    const token = wx.getStorageSync('token');
    if (!userId || !token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    const { repairForm } = this.data;

    // 前端预校验
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
      // 提交数据：补充userId
      const submitData = {
        userId,
        repairType: repairForm.repairType,
        description: repairForm.description,
        address: repairForm.address,
        // 可选字段：有值才传
        ...(repairForm.contactPhone ? { contactPhone: repairForm.contactPhone } : {})
      };

      console.log('【维修报修】提交数据：', submitData);

      // 调用后端真实写入数据库的接口
      const res = await post('/api/repair/orders', submitData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res?.code === 200) {
        wx.showToast({ title: res.message || '提交成功', icon: 'success' });
        
        // 提交成功后：重置表单 + 刷新我的工单
        this.setData({
          repairForm: {
            repairType: '',
            description: '',
            address: repairForm.address, // 保留地址
            contactPhone: repairForm.contactPhone // 保留手机号
          }
        });
        this.getMyOrders();

        // 可选：提交成功后返回上一页
        // setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      } else {
        wx.showToast({ title: res?.message || '提交失败', icon: 'none' });
      }
    } catch (err) {
      console.error('提交工单失败详情：', err);
      const errMsg = err.errMsg || '提交失败';
      wx.showToast({ 
        title: errMsg.includes('connect') ? '服务器连接失败' : '提交工单失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  // ========== 伪TabBar切换核心方法（最终版） ==========
  switchTab(e) {
    const tabKey = e.currentTarget.dataset.tab;
    const tabName = this.data.tabNameMap[tabKey] || '该';
    
    // 1. 过滤重复点击
    if (tabKey === this.data.activeTab) return;

    // 2. 获取目标页面路径
    const targetUrl = this.data.tabPathMap[tabKey];
    if (!targetUrl) {
      wx.showToast({ title: `${tabName}页面路径配置错误`, icon: 'none' });
      return;
    }

    // 3. 页面跳转逻辑
    try {
      if (tabKey === 'repair') {
        // 当前页：更新选中态 + 刷新工单列表
        this.setData({ activeTab: tabKey });
        this.getMyOrders();
        wx.showToast({ title: '已刷新维修工单', icon: 'none', duration: 1000 });
      } else {
        // 其他页：先更新选中态，再跳转新页面
        this.setData({ activeTab: tabKey });
        wx.navigateTo({
          url: targetUrl,
          fail: (err) => {
            console.error(`${tabName}页面跳转失败：`, err);
            // 跳转失败时回滚选中态 + 提示
            this.setData({ activeTab: 'repair' });
            if (err.errMsg.includes('page not found')) {
              wx.showToast({ title: `${tabName}页面尚未创建`, icon: 'none' });
            } else {
              wx.showToast({ title: `${tabName}页面跳转失败`, icon: 'none' });
            }
          }
        });
      }
    } catch (err) {
      console.error('Tab切换异常：', err);
      this.setData({ activeTab: 'repair' });
      wx.showToast({ title: '切换失败，请重试', icon: 'none' });
    }
  }
});