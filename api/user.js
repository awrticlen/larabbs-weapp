const { authRequest } = require('../utils/request')

const getCurrentUser = () => authRequest('user', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
})

module.exports = {
  getCurrentUser
}