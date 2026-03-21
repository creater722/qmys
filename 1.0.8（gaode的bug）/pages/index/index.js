Page({
  onSearchConfirm(e) {
    const v = (e.detail && e.detail.value) || ''
    if (!v) {
      wx.showToast({ title: '请输入关键词', icon: 'none' })
      return
    }
    wx.showToast({ title: `搜索：${v}`, icon: 'none' })
  },
  goTab(e) {
    const url = e.currentTarget.dataset.tab
    if (url) {
      wx.switchTab({ url })
    }
  },
  goPage(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url })
    }
  }
})
