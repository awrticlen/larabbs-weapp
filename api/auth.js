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
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  data: { phone }
})

const getVerificationCode = (key, code) => request('verificationCodes', {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data: {
    captcha_key: key,
    captcha_code: code
  }
})

const register = (data) => request('weapp/users', {
  method: 'POST',
  header: {
    Accept: 'application/json'
  },
  data
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
  getVerificationCode,
  login,
  logout,
  refresh,
  register
}
