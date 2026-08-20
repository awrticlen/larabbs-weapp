const { getUser } = require('../../api/user')
const { diffForHumans } = require('../../utils/time')

const DEFAULT_AVATAR = '/assets/images/user.png'

const normalizeUserId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getErrorMessage = (error) => {
  const response = error && error.response
  const statusCode = response && response.statusCode
  const data = response && response.data

  if (statusCode === 404) {
    return '用户不存在或已注销'
  }

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return '获取用户资料失败，请稍后重试'
}

const normalizeUser = (user = {}) => {
  const avatar = typeof user.avatar === 'string' ? user.avatar : ''
  const createdAtText = diffForHumans(user.created_at)
  const lastActivedAtText = diffForHumans(user.last_actived_at)

  return {
    id: normalizeUserId(user.id),
    avatar: avatar && !/\.svg(?:$|\?)/i.test(avatar) ? avatar : DEFAULT_AVATAR,
    name: typeof user.name === 'string' && user.name ? user.name : '匿名用户',
    introduction: typeof user.introduction === 'string' ? user.introduction : '',
    email: typeof user.email === 'string' ? user.email : '',
    createdAtText: createdAtText || '未知',
    lastActivedAtText: lastActivedAtText || '暂无记录'
  }
}

Page({
  data: {
    userId: null,
    user: null,
    isLoading: false,
    errorMessage: ''
  },

  onLoad(options = {}) {
    const userId = normalizeUserId(options.id)

    if (!userId) {
      this.setData({ errorMessage: '用户链接无效' })
      return
    }

    this.setData({ userId })
    this.loadUser(userId)
  },

  onShareAppMessage() {
    const user = this.data.user || {}

    return {
      title: user.name || '用户主页',
      path: `/pages/users/show?id=${this.data.userId || user.id || ''}`,
      imageUrl: user.avatar || DEFAULT_AVATAR
    }
  },

  retryLoad() {
    if (this.data.userId) {
      return this.loadUser(this.data.userId)
    }

    return Promise.resolve(false)
  },

  async loadUser(userId) {
    const requestId = (this.userRequestId || 0) + 1
    this.userRequestId = requestId

    this.setData({
      user: null,
      isLoading: true,
      errorMessage: ''
    })

    try {
      const response = await getUser(userId)

      if (requestId !== this.userRequestId) {
        return false
      }

      const user = normalizeUser(response.data)

      this.setData({ user })
      wx.setNavigationBarTitle({ title: `${user.name} 的主页` })

      return true
    } catch (error) {
      if (requestId === this.userRequestId) {
        this.setData({ errorMessage: getErrorMessage(error) })
      }

      return false
    } finally {
      if (requestId === this.userRequestId) {
        this.setData({ isLoading: false })
      }
    }
  }
})