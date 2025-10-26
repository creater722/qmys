// pages/index/index.js
Page({
    data: {
      bannerHeight: 400, // 轮播图高度，单位rpx转换为px需要计算
      
      // 轮播图数据
      bannerList: [
        {
          id: 1,
          imageUrl: '/images/1.jpg',
          linkUrl: '/pages/logs/logs'
        },
        {
          id: 2,
          imageUrl: '/images/2.jpg',
          linkUrl: '/pages/logs/logs'
        },
        {
          id: 3,
          imageUrl: '/images/3.jpg',
          linkUrl: '/pages/logs/logs'
        }
      ]
    },
  
    onLoad() {
      // 计算轮播图实际高度（rpx转px）
      this.calculateBannerHeight()
    },
  
    calculateBannerHeight() {
      // 获取系统信息
      wx.getSystemInfo({
        success: (res) => {
          // rpx转px的比例
          const rpxRatio = res.screenWidth / 750
          const bannerHeight = 400 * rpxRatio
          this.setData({
            bannerHeight: Math.ceil(bannerHeight)
          })
        }
      })
    },
  
    // 其他方法保持不变
    onBannerTap(e) {
      const url = e.currentTarget.dataset.url
      if (url) {
        wx.navigateTo({
          url: url
        })
      }
    }
  })