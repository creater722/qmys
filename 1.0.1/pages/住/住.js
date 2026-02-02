// pages/住/住.js
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
      hotel: { page: 'list', title: '酒店预订', type: 'hotel' },
      rent: { page: 'list', title: '租房信息', type: 'rent' },
      repair: { page: 'form', title: '维修报修', type: 'repair' },
      property: { page: 'detail', title: '物业服务', type: 'property' }
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
