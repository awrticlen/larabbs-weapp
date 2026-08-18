const { getUserReplies } = require('../../api/reply')
const { createListRefreshMixin } = require('../../mixins/list-refresh')
const { normalizeReply } = require('../../utils/reply')

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
    this.reloadList({ clear: true })
  }
})