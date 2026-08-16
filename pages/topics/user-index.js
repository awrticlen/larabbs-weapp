const { getUserTopics } = require('../../api/topic')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const eventHub = require('../../utils/event-hub')
const { normalizeTopic } = require('../../utils/topic')

const normalizeUserId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const listRefresh = createListRefreshMixin({
  fetchPage: ({ page, pageInstance }) => getUserTopics(pageInstance.data.userId, {
    page,
    include: 'user,category'
  }),
  normalizeItem: normalizeTopic,
  canLoad: (pageInstance) => Boolean(pageInstance.data.userId),
  fallbackErrorMessage: '获取用户话题失败，请稍后重试'
})

Page({
  ...listRefresh,

  data: {
    ...listRefresh.data,
    userId: null
  },

  onLoad(options = {}) {
    this.topicDeletedHandler = () => this.reloadList({ clear: true })
    eventHub.on('topic-deleted', this.topicDeletedHandler)

    const userId = normalizeUserId(options.id)

    if (!userId) {
      this.setData({ errorMessage: '用户链接无效' })
      return
    }

    this.setData({ userId })
    this.reloadList({ clear: true })
  },

  onUnload() {
    eventHub.off('topic-deleted', this.topicDeletedHandler)
  }
})