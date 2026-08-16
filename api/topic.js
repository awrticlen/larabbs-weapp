const { request } = require('../utils/request')

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

const getCategories = () => request('categories', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
}, false)

module.exports = {
  getCategories,
  getTopic,
  getTopics
}