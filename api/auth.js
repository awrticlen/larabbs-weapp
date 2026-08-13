const { request } = require('../utils/request')

const login = (data) => request('weapp/authorizations', {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data
})

const getCaptcha = (phone) => request('captchas', {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data: { phone }
})

const refresh = (token) => request('authorizations/current', {
  method: 'PUT',
  header: {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
  }
}, false)

const logout = (token) => request('authorizations/current', {
  method: 'DELETE',
  header: {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`
  }
}, false)

module.exports = {
  getCaptcha,
  login,
  logout,
  refresh
}
