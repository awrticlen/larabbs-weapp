const { getUserReplies } = require('../../api/reply')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const { normalizeReply } = require('../../utils/reply')
const eventHub = require('../../utils/event-hub')

const normalizeUserId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const listRefresh = createListRefreshMixin({
  fetchPage: ({ page, pageInstance }) => getUserReplies(pageInstance.data.userId, {
    page,
    include: 'user,topic'
  }),
  normalizeItem: normalizeReply,
  canLoad: (pageInstance) => Boolean(pageInstance.data.userId),
  resourceKey: 'replies',
  fallbackErrorMessage: '获取用户回复失败，请稍后重试'
})

Page({
  ...listRefresh,

  data: {
    ...listRefresh.data,
    userId: null
  },

  onLoad(options = {}) {
    const userId = normalizeUserId(options.id)

    if (!userId) {
      this.setData({ errorMessage: '用户链接无效' })
      return
    }

    this.setData({ userId })
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
    eventHub.off('reply-deleted', this.replyDeletedHandler)
  }
})