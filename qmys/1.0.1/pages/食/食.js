// pages/食/食.js
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
    const key = e.currentTarget.dataset.key
    const map = {
      restaurant: { page: 'list', title: '附近餐厅', type: 'restaurant' },
      delivery: { page: 'form', title: '外卖订餐', type: 'delivery' },
      grocery: { page: 'list', title: '食材采购', type: 'grocery' },
      safety: { page: 'detail', title: '食品安全提示', type: 'safety' }
    }
    const item = map[key]
    if (item) {
      wx.navigateTo({
        url: `/pages/common/${item.page}/${item.page}?title=${item.title}&type=${item.type}`
      })
    } else {
      wx.showToast({ title: '功能待接入', icon: 'none' })
    }
  }
})
