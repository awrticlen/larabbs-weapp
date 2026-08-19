const { authRequest } = require('../utils/request')

const getNotificationStats = () => authRequest('notifications/stats', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
}, false)

module.exports = {
  getNotificationStats
}