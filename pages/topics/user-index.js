const { getUserTopics } = require('../../api/topic')
const { normalizeTopic } = require('../../utils/topic')

const normalizeUserId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return '获取用户话题失败，请稍后重试'
}

Page({
  data: {
    userId: null,
    topics: [],
    page: 1,
    noMoreData: false,
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
    this.loadTopics({ reset: true, page: 1, userId })
  },

  async onPullDownRefresh() {
    try {
      if (this.data.userId) {
        await this.loadTopics({ reset: true, page: 1 })
      }
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  onReachBottom() {
    if (!this.data.userId || this.data.noMoreData || this.data.isLoading) {
      return
    }

    this.loadTopics({ page: this.data.page + 1 })
  },

  async retryLoad() {
    if (this.data.userId) {
      await this.loadTopics({ reset: true, page: 1 })
    }
  },

  async loadTopics({
    reset = false,
    page = this.data.page,
    userId = this.data.userId
  } = {}) {
    const requestId = (this.topicRequestId || 0) + 1
    this.topicRequestId = requestId

    this.setData({
      isLoading: true,
      errorMessage: ''
    })

    try {
      const response = await getUserTopics(userId, {
        page,
        include: 'user,category'
      })

      if (requestId !== this.topicRequestId) {
        return false
      }

      const payload = response.data || {}
      const topics = Array.isArray(payload.data)
        ? payload.data.map(normalizeTopic)
        : []
      const pagination = payload.meta || {}
      const currentPage = Number(pagination.current_page) || page
      const lastPage = Number(pagination.last_page)
      const noMoreData = Number.isFinite(lastPage)
        ? currentPage >= lastPage
        : topics.length === 0

      this.setData({
        topics: reset ? topics : this.data.topics.concat(topics),
        page: currentPage,
        noMoreData,
        errorMessage: ''
      })

      return true
    } catch (error) {
      if (requestId === this.topicRequestId) {
        this.setData({ errorMessage: getErrorMessage(error) })
      }

      return false
    } finally {
      if (requestId === this.topicRequestId) {
        this.setData({ isLoading: false })
      }
    }
  }
})