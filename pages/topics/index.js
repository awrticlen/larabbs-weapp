const { diffForHumans } = require('../../utils/time')
const { getTopics } = require('../../api/topic')

const DEFAULT_AVATAR = '/assets/images/user.png'

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return '获取话题失败，请稍后重试'
}

const normalizeTopic = (topic = {}) => {
  const user = topic.user || {}
  const category = topic.category || {}
  const avatar = typeof user.avatar === 'string' ? user.avatar : ''

  return {
    id: topic.id,
    title: topic.title || '未命名话题',
    categoryName: category.name || '未分类',
    userName: user.name || '匿名用户',
    updatedAt: topic.updated_at || '',
    updatedAtText: diffForHumans(topic.updated_at),
    replyCount: Number(topic.reply_count) || 0,
    avatar: avatar && !/\.svg(?:$|\?)/i.test(avatar) ? avatar : DEFAULT_AVATAR
  }
}

Page({
  data: {
    topics: [],
    page: 1,
    noMoreData: false,
    isLoading: false,
    errorMessage: ''
  },

  onLoad() {
    this.loadTopics({ reset: true })
  },

  async onPullDownRefresh() {
    try {
      await this.loadTopics({ reset: true })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  onReachBottom() {
    if (this.data.noMoreData || this.data.isLoading) {
      return
    }

    this.loadTopics({ page: this.data.page + 1 })
  },

  async loadTopics({ reset = false, page = this.data.page } = {}) {
    if (this.data.isLoading) {
      return false
    }

    this.setData({
      isLoading: true,
      errorMessage: ''
    })

    try {
      const response = await getTopics({
        page,
        include: 'user,category'
      })
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
      this.setData({
        errorMessage: getErrorMessage(error)
      })

      return false
    } finally {
      this.setData({ isLoading: false })
    }
  }
})