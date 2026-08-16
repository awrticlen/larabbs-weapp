const { deleteTopic: deleteTopicRequest, getTopic } = require('../../api/topic')
const eventHub = require('../../utils/event-hub')
const { diffForHumans } = require('../../utils/time')

const DEFAULT_AVATAR = '/assets/images/user.png'

const normalizeTopicId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getErrorMessage = (error, fallback = '获取话题失败，请稍后重试') => {
  const response = error && error.response
  const statusCode = response && response.statusCode
  const data = response && response.data

  if (statusCode === 404) {
    return '话题不存在或已删除'
  }

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return fallback
}

const canDeleteTopic = (topic) => {
  const authState = getApp().syncAuthState()
  const currentUserId = authState.user && Number(authState.user.id)
  const authorId = topic && Number(topic.userId)

  return Boolean(
    authState.isLoggedIn
      && currentUserId
      && authorId
      && currentUserId === authorId
  )
}

const normalizeTopic = (topic = {}) => {
  const user = topic.user || {}
  const category = topic.category || {}
  const avatar = typeof user.avatar === 'string' ? user.avatar : ''

  return {
    id: topic.id,
    title: typeof topic.title === 'string' && topic.title ? topic.title : '未命名话题',
    body: typeof topic.body === 'string' ? topic.body : '',
    categoryName: typeof category.name === 'string' && category.name ? category.name : '未分类',
    userId: normalizeTopicId(user.id),
    userName: typeof user.name === 'string' && user.name ? user.name : '匿名用户',
    userIntroduction: typeof user.introduction === 'string' ? user.introduction : '',
    updatedAtText: diffForHumans(topic.updated_at),
    replyCount: Number(topic.reply_count) || 0,
    avatar: avatar && !/\.svg(?:$|\?)/i.test(avatar) ? avatar : DEFAULT_AVATAR
  }
}

Page({
  data: {
    topicId: null,
    topic: null,
    canDelete: false,
    deleting: false,
    isLoading: false,
    errorMessage: ''
  },

  onLoad(options = {}) {
    const topicId = normalizeTopicId(options.id)

    if (!topicId) {
      this.setData({ errorMessage: '话题链接无效' })
      return
    }

    this.setData({ topicId })
    this.loadTopic(topicId)
  },

  onShow() {
    if (this.data.topic) {
      this.setData({ canDelete: canDeleteTopic(this.data.topic) })
    }
  },

  async retryLoad() {
    if (this.data.topicId) {
      await this.loadTopic(this.data.topicId)
    }
  },

  async loadTopic(topicId) {
    const requestId = (this.topicRequestId || 0) + 1
    this.topicRequestId = requestId

    this.setData({
      isLoading: true,
      errorMessage: '',
      topic: null
    })

    try {
      const response = await getTopic(topicId, { include: 'user,category' })

      if (requestId !== this.topicRequestId) {
        return
      }

      const topic = normalizeTopic(response.data)

      this.setData({
        topic,
        canDelete: canDeleteTopic(topic)
      })
    } catch (error) {
      if (requestId === this.topicRequestId) {
        this.setData({ errorMessage: getErrorMessage(error) })
      }
    } finally {
      if (requestId === this.topicRequestId) {
        this.setData({ isLoading: false })
      }
    }
  },

  async deleteTopic() {
    if (!this.data.canDelete || this.data.deleting || !this.data.topic) {
      return
    }

    const modal = await wx.showModal({
      title: '确认删除',
      content: '您确认删除该话题吗？',
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!modal.confirm) {
      return
    }

    this.setData({
      deleting: true,
      errorMessage: ''
    })

    try {
      await deleteTopicRequest(this.data.topic.id)
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      const deletedTopic = this.data.topic
      setTimeout(() => {
        eventHub.emit('topic-deleted', deletedTopic)
        wx.navigateBack({ delta: 1 })
      }, 2000)
    } catch (error) {
      this.setData({
        deleting: false,
        errorMessage: getErrorMessage(error, '删除话题失败，请稍后重试')
      })
    }
  }
})