const { authRequest, request } = require('../utils/request')

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

const createReply = (topicId, data = {}) => authRequest(`topics/${topicId}/replies`, {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data
})

const deleteReply = (topicId, replyId) => authRequest(`topics/${topicId}/replies/${replyId}`, {
  method: 'DELETE',
  header: {
    Accept: 'application/json'
  }
})

module.exports = {
  createReply,
  deleteReply,
  getReplies,
  getUserReplies
}