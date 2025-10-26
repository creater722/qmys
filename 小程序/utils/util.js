// utils/util.js
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
  
    return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
  }
  
  const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : `0${n}`
  }
  
  // 网络请求封装
  const request = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: getApp().globalData.baseUrl + url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          ...options.header
        },
        success(res) {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  }
  
  // 显示加载提示
  const showLoading = (title = '加载中...') => {
    wx.showLoading({
      title: title,
      mask: true
    })
  }
  
  // 隐藏加载提示
  const hideLoading = () => {
    wx.hideLoading()
  }
  
  // 显示提示信息
  const showToast = (title, icon = 'none') => {
    wx.showToast({
      title: title,
      icon: icon,
      duration: 2000
    })
  }
  
  module.exports = {
    formatTime,
    request,
    showLoading,
    hideLoading,
    showToast
  }