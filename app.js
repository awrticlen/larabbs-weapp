const { login: loginRequest, logout: logoutRequest, refresh: refreshRequest, register: registerRequest } = require('./api/auth')
const { getCurrentUser, updateCurrentUser: updateCurrentUserRequest } = require('./api/user')
const auth = require('./utils/auth')
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

App({
  globalData: {
    auth: auth.getAuthState()
  },

  onLaunch() {
    this.syncAuthState()

    if (auth.getToken() && !auth.hasValidToken()) {
      this.ensureAuth().catch(() => {
        this.syncAuthState()
      })
    }
  },

  syncAuthState() {
    this.globalData.auth = auth.getAuthState()
    return this.globalData.auth
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
    auth.setToken(response.data)
    this.syncAuthState()
    await this.loadCurrentUser()

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
    auth.setToken(response.data)
    this.syncAuthState()
    await this.loadCurrentUser()

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
      this.syncAuthState()
    }
  }
})