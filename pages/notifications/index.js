const { getNotifications, readNotifications } = require('../../api/notification')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const { normalizeNotification } = require('../../utils/notification-list')

const listRefresh = createListRefreshMixin({
  fetchPage: ({ page }) => getNotifications({ page }),
  normalizeItem: normalizeNotification,
  resourceKey: 'notifications',
  fallbackErrorMessage: '获取消息失败，请稍后重试'
})

Page({
  ...listRefresh,

  data: {
    ...listRefresh.data
  },

  onLoad() {
    this.loadNotifications()
  },

  onShow() {
    if (this.hasLoadedNotifications) {
      this.markNotificationsAsRead()
    }
  },

  async onPullDownRefresh() {
    try {
      await this.loadNotifications()
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  async loadNotifications() {
    if (!getApp().syncAuthState().isLoggedIn) {
      this.setData({ errorMessage: '请先登录后查看消息' })
      return false
    }

    const loaded = await this.reloadList({ clear: true })

    if (loaded) {
      this.hasLoadedNotifications = true
      await this.markNotificationsAsRead()
    }

    return loaded
  },

  async markNotificationsAsRead() {
    if (this.markingNotificationsRead || !getApp().syncAuthState().isLoggedIn) {
      return false
    }

    this.markingNotificationsRead = true

    try {
      await readNotifications()
      getApp().setUnreadCount(0)
      return true
    } catch (error) {
      return false
    } finally {
      this.markingNotificationsRead = false
    }
  }
})