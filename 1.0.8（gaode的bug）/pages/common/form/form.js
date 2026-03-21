Page({
  data: {
    title: '表单',
    formTitle: '',
    formDesc: '',
    fields: [],
    formData: {}
  },
  onLoad(options) {
    const { title, type } = options
    this.setData({ title: title || '表单' })
    this.initForm(type)
  },
  initForm(type) {
    let fields = []
    let formTitle = ''
    let formDesc = ''
    
    switch(type) {
      case 'register': // 挂号
        formTitle = '预约挂号'
        formDesc = '请填写就诊人信息'
        fields = [
          { name: 'name', label: '就诊人姓名', type: 'text', placeholder: '请输入真实姓名' },
          { name: 'phone', label: '联系电话', type: 'tel', placeholder: '请输入手机号' },
          { name: 'dept', label: '预约科室', type: 'text', placeholder: '例如：内科' },
          { name: 'date', label: '预约日期', type: 'date', placeholder: '选择日期' }
        ]
        break;
      case 'delivery': // 外卖
        formTitle = '外卖下单'
        formDesc = '填写收货信息'
        fields = [
          { name: 'address', label: '收货地址', type: 'text', placeholder: '请输入详细地址' },
          { name: 'phone', label: '联系电话', type: 'tel', placeholder: '请输入手机号' },
          { name: 'remark', label: '备注', type: 'textarea', placeholder: '口味偏好等' }
        ]
        break;
      case 'hotel': // 酒店
        formTitle = '酒店预订'
        formDesc = '预订您的入住行程'
        fields = [
          { name: 'name', label: '入住人姓名', type: 'text', placeholder: '请输入姓名' },
          { name: 'date', label: '入住日期', type: 'date', placeholder: '选择日期' },
          { name: 'days', label: '入住天数', type: 'tel', placeholder: '请输入天数' }
        ]
        break;
      case 'repair': // 报修
        formTitle = '故障报修'
        formDesc = '请描述您遇到的问题'
        fields = [
          { name: 'type', label: '故障类型', type: 'text', placeholder: '例如：水管漏水' },
          { name: 'desc', label: '故障描述', type: 'textarea', placeholder: '请详细描述故障情况' },
          { name: 'address', label: '维修地址', type: 'text', placeholder: '请输入房号' }
        ]
        break;
      case 'service': // 售后
        formTitle = '售后服务申请'
        formDesc = '我们将为您提供优质的售后保障'
        fields = [
          { name: 'product', label: '产品名称', type: 'text', placeholder: '请输入产品名称' },
          { name: 'issue', label: '问题描述', type: 'textarea', placeholder: '请描述您遇到的问题' },
          { name: 'phone', label: '联系电话', type: 'tel', placeholder: '请输入手机号' }
        ]
        break;
      case 'taxi': // 打车
        formTitle = '现在用车'
        formDesc = '输入目的地立即出发'
        fields = [
           { name: 'from', label: '出发地', type: 'text', placeholder: '当前位置' },
           { name: 'to', label: '目的地', type: 'text', placeholder: '请输入目的地' },
           { name: 'phone', label: '联系电话', type: 'tel', placeholder: '请输入手机号' }
        ]
        break;
      default:
        formTitle = '通用表单'
        fields = [
          { name: 'info', label: '信息', type: 'text', placeholder: '请输入' }
        ]
    }
    this.setData({ fields, formTitle, formDesc })
  },
  onInput(e) {
    const { name } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${name}`]: value
    })
  },
  onDateChange(e) {
    const { name } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${name}`]: value
    })
  },
  onSubmit() {
    // 简单的校验
    const { formData, fields } = this.data
    // 模拟提交
    wx.showLoading({ title: '提交中' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})