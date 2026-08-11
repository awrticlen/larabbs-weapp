const { request } = require('../utils/request')

const login = (data) => request('weapp/authorizations', {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data
})

module.exports = {
  login
}