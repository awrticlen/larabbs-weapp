const ACCESS_TOKEN_KEY = 'access_token'
const ACCESS_TOKEN_EXPIRED_AT_KEY = 'access_token_expired_at'
const USER_KEY = 'user'

const getUser = () => wx.getStorageSync(USER_KEY) || null

const setUser = (user) => {
  if (user) {
    wx.setStorageSync(USER_KEY, user)
  } else {
    wx.removeStorageSync(USER_KEY)
  }

  return user
}

const getToken = () => wx.getStorageSync(ACCESS_TOKEN_KEY) || ''

const getTokenExpiredAt = () => wx.getStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY) || 0

const setToken = (tokenPayload) => {
  if (!tokenPayload || !tokenPayload.access_token) {
    throw new Error('登录响应缺少 access_token')
  }

  const expiresIn = Number(tokenPayload.expires_in)
  const expiredAt = Number.isFinite(expiresIn) && expiresIn > 0
    ? Date.now() + expiresIn * 1000
    : 0

  wx.setStorageSync(ACCESS_TOKEN_KEY, tokenPayload.access_token)

  if (expiredAt) {
    wx.setStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY, expiredAt)
  } else {
    wx.removeStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY)
  }

  return {
    accessToken: tokenPayload.access_token,
    accessTokenExpiredAt: expiredAt
  }
}

const hasValidToken = () => {
  const token = getToken()
  const expiredAt = Number(getTokenExpiredAt())

  return Boolean(token && (!expiredAt || expiredAt > Date.now()))
}

const getAuthState = () => ({
  user: getUser(),
  accessToken: getToken(),
  accessTokenExpiredAt: getTokenExpiredAt(),
  isLoggedIn: hasValidToken()
})

const clearToken = () => {
  wx.removeStorageSync(ACCESS_TOKEN_KEY)
  wx.removeStorageSync(ACCESS_TOKEN_EXPIRED_AT_KEY)
}

const logout = () => {
  clearToken()
  setUser(null)
}

module.exports = {
  clearToken,
  getAuthState,
  getToken,
  getTokenExpiredAt,
  getUser,
  hasValidToken,
  isLoggedIn: hasValidToken,
  logout,
  saveToken: setToken,
  setToken,
  setUser
}
