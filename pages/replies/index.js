const { getReplies } = require('../../api/reply')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const { normalizeReply } = require('../../utils/reply')
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
    topicId: null
  },

  onLoad(options = {}) {
    const topicId = Number(options.topic_id)

    if (!Number.isInteger(topicId) || topicId <= 0) {
      this.setData({ errorMessage: '话题链接无效' })
      return
    }

    this.setData({ topicId })
    this.replyCreatedHandler = (payload = {}) => {
      if (normalizeTopicId(payload.topicId) !== topicId) {
        return
      }

      this.reloadList({ clear: true })
    }
    eventHub.on('reply-created', this.replyCreatedHandler)
    this.reloadList({ clear: true })
  },

  onUnload() {
    eventHub.off('reply-created', this.replyCreatedHandler)
  }
})