const { request } = require('../utils/request')

const getTopics = (data = {}) => request('topics', {
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
  getTopics
}