const { createReply } = require('../../api/reply')
const eventHub = require('../../utils/event-hub')

const normalizeTopicId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const getErrorMessage = (error, fallback = '发布回复失败，请稍后重试') => {
  const response = error && error.response
  const data = response && response.data

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return fallback
}

Page({
  data: {
    topicId: null,
    content: '',
    contentLength: 0,
    contentError: '',
    errorMessage: '',
    submitting: false,
    navigating: false,
    shouldFocus: false
  },

  onLoad(options = {}) {
    const topicId = normalizeTopicId(options.topic_id)

    if (!topicId) {
      this.setData({ errorMessage: '话题链接无效' })
      return
    }

    this.setData({ topicId })
    this.redirectIfLoggedOut()
  },

  redirectIfLoggedOut() {
    const authState = getApp().syncAuthState()

    if (authState.isLoggedIn || this.loginRedirecting) {
      return authState.isLoggedIn
    }

    this.loginRedirecting = true
    wx.navigateTo({
      url: '/pages/auth/login',
      complete: () => {
        this.loginRedirecting = false
      }
    })

    return false
  },

  handleContentInput(event) {
    const content = event.detail.value || ''

    this.setData({
      content,
      contentLength: content.length,
      contentError: '',
      errorMessage: ''
    })
  },

  async submit() {
    if (this.data.submitting || this.data.navigating) {
      return
    }

    if (!this.redirectIfLoggedOut()) {
      return
    }

    const content = this.data.content.trim()

    if (!content) {
      this.setData({ contentError: '请填写回复内容' })
      return
    }

    this.setData({
      content,
      contentLength: content.length,
      contentError: '',
      errorMessage: '',
      submitting: true
    })

    try {
      const response = await createReply(this.data.topicId, { content })

      eventHub.emit('reply-created', {
        topicId: this.data.topicId,
        reply: response.data
      })
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
      this.setData({ navigating: true })

      setTimeout(() => {
        wx.navigateBack({ delta: 1 })
      }, 1200)
    } catch (error) {
      this.setData({
        errorMessage: getErrorMessage(error)
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})