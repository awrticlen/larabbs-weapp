const { createSyncBadgeMixin } = require('../../mixins/sync-badge')

const getAuthState = () => getApp().syncAuthState()
const syncBadge = createSyncBadgeMixin()

Page({
  ...syncBadge,

  data: {
    ...syncBadge.data,
    loggedIn: false,
    user: null,
    loggingOut: false,
    errorMessage: ''
  },

  onLoad() {
    this.initUnreadBadge()
  },

  onShow() {
    const authState = getAuthState()

    this.refreshUnreadBadge()

    this.setData({
      loggedIn: authState.isLoggedIn,
      user: authState.user,
      errorMessage: ''
    })
  },

  onUnload() {
    this.disposeUnreadBadge()
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