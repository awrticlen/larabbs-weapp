const { getToken, getTokenExpiredAt } = require('./auth')

const BASE_URL = 'http://larabbs.test/api/v1'

const getErrorMessage = (response) => {
  const data = response && response.data
  const message = data && data.message

  if (typeof message === 'string' && message) {
    return message
  }

  const errors = data && data.errors
  if (errors && typeof errors === 'object') {
    const firstError = Object.keys(errors)
      .map((field) => errors[field])
      .flat()
      .find((item) => typeof item === 'string' && item)

    if (firstError) {
      return firstError
    }
  }

  return '请求失败，请稍后重试'
}

const showStatusMessage = (response) => {
  if (response.statusCode === 429) {
    wx.showModal({
      title: '提示',
      content: '请求太频繁，请稍后再试',
      showCancel: false
    })
  }

  if (response.statusCode >= 500) {
    wx.showModal({
      title: '提示',
      content: '服务器错误，请联系管理员或重试',
      showCancel: false
    })
  }
}

const request = (path, options = {}, showLoading = true) => {
  if (showLoading) {
    wx.showLoading({ title: '加载中' })
  }

  const url = `${BASE_URL}/${path.replace(/^\/+/, '')}`

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response)
          return
        }

        showStatusMessage(response)
        const error = new Error(getErrorMessage(response))
        error.response = response
        reject(error)
      },
      fail(error) {
        reject(error)
      },
      complete() {
        if (showLoading) {
          wx.hideLoading()
        }
      }
    })
  })
}

const getAppInstance = () => {
  try {
    return getApp()
  } catch (error) {
    return null
  }
}

const ensureAuthToken = async () => {
  const token = getToken()
  const expiredAt = Number(getTokenExpiredAt())

  if (!token) {
    throw new Error('请先登录')
  }

  if (expiredAt && Date.now() >= expiredAt) {
    const app = getAppInstance()

    if (!app || typeof app.ensureAuth !== 'function') {
      throw new Error('登录状态已过期')
    }

    await app.ensureAuth()
  }

  const currentToken = getToken()
  if (!currentToken) {
    throw new Error('登录状态已失效')
  }

  return currentToken
}

const authRequest = async (path, options = {}, showLoading = true) => {
  const token = await ensureAuthToken()

  return request(path, {
    ...options,
    header: {
      ...(options.header || {}),
      Authorization: `Bearer ${token}`
    }
  }, showLoading)
}

module.exports = {
  authRequest,
  request
}
