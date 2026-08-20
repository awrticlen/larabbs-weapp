const { login: loginRequest, logout: logoutRequest, refresh: refreshRequest, register: registerRequest } = require('./api/auth')
const {
  getCurrentUser,
  getPerms: getPermsRequest,
  updateCurrentUser: updateCurrentUserRequest
} = require('./api/user')
const { getNotificationStats } = require('./api/notification')
const auth = require('./utils/auth')
const eventHub = require('./utils/event-hub')
const {
  emitUnreadCountUpdated,
  normalizeUnreadCount
} = require('./utils/notification')
const { login: getLoginCode } = require('./utils/wechat')

const getLoginParams = async (credentials = {}) => {
  const loginData = await getLoginCode()

  if (!loginData.code) {
    throw new Error('微信登录没有返回 code')
  }

  return {
    ...credentials,
    code: loginData.code
  }
}

const loginWithCode = async (credentials = {}) => loginRequest(await getLoginParams(credentials))

const extractPermissions = (response) => {
  const payload = response && response.data

  return payload && Array.isArray(payload.data) ? payload.data : payload
}

App({
  globalData: {
    auth: auth.getAuthState(),
    notification: {
      unreadCount: 0
    }
  },

  onLaunch() {
    this.syncAuthState()
    this.startUnreadCountPolling()
    this.restoreAuthAndUnreadCount()
  },

  onShow() {
    this.restoreAuthAndUnreadCount()
  },

  syncAuthState() {
    this.globalData.auth = auth.getAuthState()
    return this.globalData.auth
  },

  can(targetPerm) {
    const authState = this.syncAuthState()

    if (!authState.isLoggedIn || !authState.permsLoaded || typeof targetPerm !== 'string' || !targetPerm) {
      return false
    }

    return authState.perms.some((perm) => perm.name === targetPerm)
  },

  async loadPermissions() {
    if (!auth.hasValidToken()) {
      throw new Error('登录状态已失效')
    }

    const requestId = (this.permissionsRequestId || 0) + 1
    this.permissionsRequestId = requestId
    const response = await getPermsRequest()

    if (requestId !== this.permissionsRequestId || !auth.hasValidToken()) {
      return this.syncAuthState().perms
    }

    const perms = auth.setPerms(extractPermissions(response))
    this.syncAuthState()
    eventHub.emit('permissions-updated', perms)

    return perms
  },

  async ensurePermissions() {
    if (auth.hasPerms()) {
      return this.syncAuthState().perms
    }

    if (this.permissionsPromise) {
      return this.permissionsPromise
    }

    const request = this.loadPermissions()
      .finally(() => {
        if (this.permissionsPromise === request) {
          this.permissionsPromise = null
        }
      })

    this.permissionsPromise = request

    return request
  },

  invalidatePermissions() {
    this.permissionsRequestId = (this.permissionsRequestId || 0) + 1
    this.permissionsPromise = null
    auth.clearPerms()
    this.syncAuthState()
    eventHub.emit('permissions-updated', [])
  },

  getUnreadCount() {
    return normalizeUnreadCount(this.globalData.notification && this.globalData.notification.unreadCount)
  },

  setUnreadCount(value) {
    const unreadCount = normalizeUnreadCount(value)

    if (!this.globalData.notification) {
      this.globalData.notification = { unreadCount: 0 }
    }

    if (this.globalData.notification.unreadCount === unreadCount) {
      return unreadCount
    }

    this.globalData.notification.unreadCount = unreadCount
    emitUnreadCountUpdated(unreadCount)

    return unreadCount
  },

  resetUnreadCount() {
    this.unreadCountRequestId = (this.unreadCountRequestId || 0) + 1
    this.unreadCountPromise = null

    return this.setUnreadCount(0)
  },

  async updateUnreadCount() {
    if (!auth.getToken()) {
      return this.resetUnreadCount()
    }

    if (this.unreadCountPromise) {
      return this.unreadCountPromise
    }

    const requestId = (this.unreadCountRequestId || 0) + 1
    this.unreadCountRequestId = requestId

    const request = getNotificationStats()
      .then((response) => {
        if (requestId !== this.unreadCountRequestId) {
          return this.getUnreadCount()
        }

        return this.setUnreadCount(response && response.data && response.data.unread_count)
      })
      .finally(() => {
        if (this.unreadCountPromise === request) {
          this.unreadCountPromise = null
        }
      })

    this.unreadCountPromise = request

    return request
  },

  startUnreadCountPolling() {
    if (this.unreadCountTimer) {
      return
    }

    this.unreadCountTimer = setInterval(() => {
      this.restoreAuthAndUnreadCount()
    }, 60000)
  },

  async restoreAuthAndUnreadCount() {
    if (!auth.getToken()) {
      return this.resetUnreadCount()
    }

    try {
      await this.ensureAuth()
    } catch (error) {
      this.syncAuthState()
      return this.resetUnreadCount()
    }

    try {
      await this.ensurePermissions()
    } catch (error) {
      this.syncAuthState()
    }

    try {
      return await this.updateUnreadCount()
    } catch (error) {
      return this.getUnreadCount()
    }
  },

  async loadCurrentUser() {
    if (!auth.hasValidToken()) {
      throw new Error('登录状态已失效')
    }

    const response = await getCurrentUser()
    auth.setUser(response.data)
    this.syncAuthState()

    return response.data
  },

  async updateCurrentUser(data = {}) {
    const response = await updateCurrentUserRequest(data)
    auth.setUser(response.data)
    this.syncAuthState()

    return response.data
  },

  async login(credentials = {}) {
    const response = await loginWithCode(credentials)
    this.invalidatePermissions()
    auth.setToken(response.data)
    this.syncAuthState()
    await this.loadCurrentUser()
    await this.loadPermissions()
    this.updateUnreadCount().catch(() => {})

    return this.globalData.auth
  },

  async register(data = {}) {
    await registerRequest(await getLoginParams(data))
    return this.login()
  },

  async refresh() {
    const token = auth.getToken()

    if (!token) {
      throw new Error('没有可刷新的登录凭证')
    }

    const response = await refreshRequest(token)
    this.invalidatePermissions()
    auth.setToken(response.data)
    this.syncAuthState()
    await this.loadCurrentUser()
    await this.loadPermissions()
    this.updateUnreadCount().catch(() => {})

    return this.globalData.auth
  },

  async ensureAuth() {
    if (auth.hasValidToken()) {
      return this.syncAuthState()
    }

    if (!auth.getToken()) {
      throw new Error('请先登录')
    }

    if (this.authPromise) {
      return this.authPromise
    }

    this.authPromise = this.refresh()
      .catch(() => this.login())
      .finally(() => {
        this.authPromise = null
      })

    return this.authPromise
  },

  async logout() {
    const token = auth.getToken()

    try {
      if (token) {
        await logoutRequest(token)
      }
    } finally {
      auth.logout()
      this.invalidatePermissions()
      this.resetUnreadCount()
    }
  }
})