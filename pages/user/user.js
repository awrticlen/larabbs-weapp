const getAuthState = () => getApp().syncAuthState()

Page({
  data: {
    loggedIn: false,
    user: null,
    loggingOut: false,
    errorMessage: ''
  },

  onShow() {
    const authState = getAuthState()

    this.setData({
      loggedIn: authState.isLoggedIn,
      user: authState.user,
      errorMessage: ''
    })
  },

  async logout() {
    if (this.data.loggingOut) {
      return
    }

    this.setData({
      loggingOut: true,
      errorMessage: ''
    })

    try {
      await getApp().logout()
    } catch (error) {
      this.setData({
        errorMessage: '退出登录请求失败，本地登录状态已清除'
      })
    } finally {
      const authState = getAuthState()

      this.setData({
        loggedIn: authState.isLoggedIn,
        user: authState.user,
        loggingOut: false
      })
    }
  }
})
