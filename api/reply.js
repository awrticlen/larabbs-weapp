const { request } = require('../utils/request')

const getReplies = (topicId, data = {}) => request(`topics/${topicId}/replies`, {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

const getUserReplies = (userId, data = {}) => request(`users/${userId}/replies`, {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

module.exports = {
  getReplies,
  getUserReplies
}