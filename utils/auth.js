const ACCESS_TOKEN_KEY = 'access_token'
const ACCESS_TOKEN_EXPIRED_AT_KEY = 'access_token_expired_at'

const saveToken = (data) => {
  wx.setStorageSync(ACCESS_TOKEN_KEY, data.access_token)

  if (data.expires_in) {
    const expiredAt = Date.now() + Number(data.expires_in) * 1000
    wx.setStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY, expiredAt)
  }
}

const hasValidToken = () => {
  const token = wx.getStorageSync(ACCESS_TOKEN_KEY)
  const expiredAt = wx.getStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY)

  return Boolean(token && (!expiredAt || Number(expiredAt) > Date.now()))
}

const clearToken = () => {
  wx.removeStorageSync(ACCESS_TOKEN_KEY)
  wx.removeStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY)
}

module.exports = {
  clearToken,
  hasValidToken,
  saveToken
}