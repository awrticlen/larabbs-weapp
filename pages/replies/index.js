const { getReplies } = require('../../api/reply')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const { normalizeReply } = require('../../utils/reply')
const auth = require('../../utils/auth')
const eventHub = require('../../utils/event-hub')

const normalizeTopicId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const listRefresh = createListRefreshMixin({
  fetchPage: ({ page, pageInstance }) => getReplies(pageInstance.data.topicId, {
    page,
    include: 'user'
  }),
  normalizeItem: normalizeReply,
  canLoad: (pageInstance) => Boolean(pageInstance.data.topicId),
  resourceKey: 'replies',
  fallbackErrorMessage: '获取回复失败，请稍后重试'
})

Page({
  ...listRefresh,

  data: {
    ...listRefresh.data,
    topicId: null,
    topicOwnerId: null,
    currentUserId: null
  },

  onLoad(options = {}) {
    const topicId = Number(options.topic_id)
    const topicOwnerId = Number(options.topic_user_id)

    if (!Number.isInteger(topicId) || topicId <= 0) {
      this.setData({ errorMessage: '话题链接无效' })
      return
    }

    this.setData({
      topicId,
      topicOwnerId: Number.isInteger(topicOwnerId) && topicOwnerId > 0 ? topicOwnerId : null,
      currentUserId: Number(auth.getUser() && auth.getUser().id) || null
    })
    this.replyCreatedHandler = (payload = {}) => {
      if (normalizeTopicId(payload.topicId) !== topicId) {
        return
      }

      this.reloadList({ clear: true })
    }
    eventHub.on('reply-created', this.replyCreatedHandler)
    this.replyDeletedHandler = (reply = {}) => {
      const replyId = Number(reply.id)

      this.setData({
        replies: this.data.replies.filter((item) => Number(item.id) !== replyId)
      })
    }
    eventHub.on('reply-deleted', this.replyDeletedHandler)
    this.reloadList({ clear: true })
  },

  onUnload() {
    eventHub.off('reply-created', this.replyCreatedHandler)
    eventHub.off('reply-deleted', this.replyDeletedHandler)
  }
})