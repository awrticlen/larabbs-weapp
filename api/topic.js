const { request } = require('../utils/request')

const getTopics = (data = {}) => request('topics', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  },
  data
}, false)

module.exports = {
  getTopics
}