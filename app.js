App({
  onLaunch() {
    wx.login({
      success: (res) => {
        console.log('login:', res)
      },
      fail: (error) => {
        console.error('login failed:', error)
      }
    })
  }
})
