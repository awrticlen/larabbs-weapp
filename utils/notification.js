const eventHub = require('./event-hub')

const UNREAD_COUNT_UPDATED_EVENT = 'unread-count-updated'

const normalizeUnreadCount = (value) => {
  const count = Number(value)

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

const getUnreadCount = () => {
  try {
    const app = getApp()
    const notification = app.globalData && app.globalData.notification

    return normalizeUnreadCount(notification && notification.unreadCount)
  } catch (error) {
    return 0
  }
}

const formatUnreadCountBadge = (value) => {
  const count = normalizeUnreadCount(value)

  return count > 99 ? '99+' : String(count)
}

const syncTabBarUnreadBadge = (value, tabBarIndex = 1) => {
  const count = normalizeUnreadCount(value)

  if (count) {
    wx.setTabBarBadge({
      index: tabBarIndex,
      text: formatUnreadCountBadge(count)
    })
    return
  }

  wx.removeTabBarBadge({ index: tabBarIndex })
}

const emitUnreadCountUpdated = (value) => {
  eventHub.emit(UNREAD_COUNT_UPDATED_EVENT, normalizeUnreadCount(value))
}

module.exports = {
  UNREAD_COUNT_UPDATED_EVENT,
  emitUnreadCountUpdated,
  formatUnreadCountBadge,
  getUnreadCount,
  normalizeUnreadCount,
  syncTabBarUnreadBadge
}