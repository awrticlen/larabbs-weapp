const { hasValidToken } = require('../../utils/auth')

Page({
  data: {
    loggedIn: false
  },

  onShow() {
    this.setData({
      loggedIn: hasValidToken()
    })
  }
})
