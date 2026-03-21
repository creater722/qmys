// pages/用/用.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
  ,
  handleTap(e) {
    console.log('handleTap called', e)
    const key = e.currentTarget.dataset.key
    console.log('key:', key)
    const map = {
      supermarket: '/pages/用/supermarketList/supermarketList',
      list: { page: 'list', title: '日用品清单', type: 'grocery' },
      discount: { page: 'list', title: '优惠活动', type: 'supermarket' },
      service: { page: 'form', title: '售后服务', type: 'service' }
    }
    const item = map[key]
    console.log('item:', item)
    if (item) {
      if (typeof item === 'string') {
        // 跳转到超市列表页面
        console.log('Navigating to:', item)
        wx.navigateTo({
          url: item,
          success: function(res) {
            console.log('Navigate success:', res)
          },
          fail: function(err) {
            console.log('Navigate fail:', err)
          }
        })
      } else {
        // 跳转到通用页面
        const url = `/pages/common/${item.page}/${item.page}?title=${item.title}&type=${item.type}`
        console.log('Navigating to:', url)
        wx.navigateTo({
          url: url,
          success: function(res) {
            console.log('Navigate success:', res)
          },
          fail: function(err) {
            console.log('Navigate fail:', err)
          }
        })
      }
    } else {
      wx.showToast({ title: '功能待接入', icon: 'none' })
    }
  }
})
