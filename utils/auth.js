const ACCESS_TOKEN_KEY = 'access_token'
const ACCESS_TOKEN_EXPIRED_AT_KEY = 'access_token_expired_at'
const USER_KEY = 'user'
const PERMS_KEY = 'perms'
const PERMS_LOADED_KEY = 'perms_loaded'

const getUser = () => wx.getStorageSync(USER_KEY) || null

const normalizePerms = (perms) => {
  if (!Array.isArray(perms)) {
    return []
  }

  return perms.filter((perm) => perm && typeof perm.name === 'string' && perm.name)
}

const getPerms = () => normalizePerms(wx.getStorageSync(PERMS_KEY))

const setPerms = (perms) => {
  const normalizedPerms = normalizePerms(perms)

  wx.setStorageSync(PERMS_KEY, normalizedPerms)
  wx.setStorageSync(PERMS_LOADED_KEY, true)

  return normalizedPerms
}

const hasPerms = () => wx.getStorageSync(PERMS_LOADED_KEY) === true

const clearPerms = () => {
  wx.removeStorageSync(PERMS_KEY)
  wx.removeStorageSync(PERMS_LOADED_KEY)
}

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
  perms: getPerms(),
  permsLoaded: hasPerms(),
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
  clearPerms()
  setUser(null)
}

module.exports = {
  clearPerms,
  clearToken,
  getAuthState,
  getPerms,
  getToken,
  getTokenExpiredAt,
  getUser,
  hasPerms,
  hasValidToken,
  isLoggedIn: hasValidToken,
  logout,
  saveToken: setToken,
  setPerms,
  setToken,
  setUser
}
