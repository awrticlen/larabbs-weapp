const { authRequest, request } = require('../utils/request')

const getTopics = (data = {}) => request('topics', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

const getTopic = (id, data = {}) => request(`topics/${id}`, {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

const getUserTopics = (userId, data = {}) => request(`users/${userId}/topics`, {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

const getCategories = () => request('categories', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
}, false)

const deleteTopic = (id) => authRequest(`topics/${id}`, {
  method: 'DELETE',
  header: {
    Accept: 'application/json'
  }
})

module.exports = {
  getCategories,
  getTopic,
  getTopics,
  getUserTopics,
  deleteTopic
}