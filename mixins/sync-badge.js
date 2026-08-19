const eventHub = require('../utils/event-hub')
const {
  UNREAD_COUNT_UPDATED_EVENT,
  getUnreadCount,
  normalizeUnreadCount,
  syncTabBarUnreadBadge
} = require('../utils/notification')

const createSyncBadgeMixin = ({ tabBarIndex = 1 } = {}) => {
  const sync = (page, value = getUnreadCount()) => {
    const unreadCount = normalizeUnreadCount(value)

    page.setData({ unreadCount })
    syncTabBarUnreadBadge(unreadCount, tabBarIndex)

    return unreadCount
  }

  return {
    data: {
      unreadCount: getUnreadCount()
    },

    initUnreadBadge() {
      this.unreadCountUpdatedHandler = (unreadCount) => sync(this, unreadCount)
      eventHub.on(UNREAD_COUNT_UPDATED_EVENT, this.unreadCountUpdatedHandler)
      sync(this)
    },

    refreshUnreadBadge() {
      sync(this)

      const app = getApp()
      if (typeof app.restoreAuthAndUnreadCount === 'function') {
        app.restoreAuthAndUnreadCount().catch(() => {})
      }
    },

    disposeUnreadBadge() {
      eventHub.off(UNREAD_COUNT_UPDATED_EVENT, this.unreadCountUpdatedHandler)
    }
  }
}

module.exports = {
  createSyncBadgeMixin
}