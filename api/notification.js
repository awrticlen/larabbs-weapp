const { authRequest } = require('../utils/request')

const getNotifications = (data = {}) => authRequest('notifications', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, true)

const getNotificationStats = () => authRequest('notifications/stats', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
}, false)

const readNotifications = () => authRequest('user/read/notifications', {
  method: 'PUT',
  header: {
    Accept: 'application/json'
  }
}, false)

module.exports = {
  getNotificationStats,
  getNotifications,
  readNotifications
}