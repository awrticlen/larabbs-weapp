const getErrorMessage = (error, fallback) => {
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

const createListRefreshMixin = ({
  fetchPage,
  normalizeItem = (item) => item,
  canLoad = () => true,
  resourceKey = 'topics',
  fallbackErrorMessage = '获取数据失败，请稍后重试'
}) => {
  if (typeof fetchPage !== 'function') {
    throw new TypeError('fetchPage 必须是函数')
  }

  const loadList = async function ({
    reset = false,
    page = reset ? 1 : this.data.page
  } = {}) {
    if (!canLoad(this)) {
      return false
    }

    const requestId = (this.listRequestId || 0) + 1
    this.listRequestId = requestId

    this.setData({
      isLoading: true,
      errorMessage: ''
    })

    try {
      const response = await fetchPage({ page, pageInstance: this })

      if (requestId !== this.listRequestId) {
        return false
      }

      const payload = response && response.data ? response.data : {}
      const items = Array.isArray(payload.data)
        ? payload.data.map(normalizeItem)
        : []
      const pagination = payload.meta || {}
      const currentPage = Number(pagination.current_page) || page
      const lastPage = Number(pagination.last_page)
      const noMoreData = Number.isFinite(lastPage)
        ? currentPage >= lastPage
        : items.length === 0

      this.setData({
        [resourceKey]: reset ? items : this.data[resourceKey].concat(items),
        page: currentPage,
        noMoreData,
        errorMessage: ''
      })

      return true
    } catch (error) {
      if (requestId === this.listRequestId) {
        this.setData({
          errorMessage: getErrorMessage(error, fallbackErrorMessage)
        })
      }

      return false
    } finally {
      if (requestId === this.listRequestId) {
        this.setData({ isLoading: false })
      }
    }
  }

  return {
    data: {
      [resourceKey]: [],
      page: 1,
      noMoreData: false,
      isLoading: false,
      errorMessage: ''
    },

    async onPullDownRefresh() {
      try {
        await this.reloadList()
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    onReachBottom() {
      if (!canLoad(this) || this.data.noMoreData || this.data.isLoading) {
        return
      }

      return this.loadList({ page: this.data.page + 1 })
    },

    resetList() {
      this.setData({
        [resourceKey]: [],
        page: 1,
        noMoreData: false,
        errorMessage: ''
      })
    },

    reloadList({ clear = false } = {}) {
      if (clear) {
        this.resetList()
      }

      return this.loadList({ reset: true, page: 1 })
    },

    loadList
  }
}

module.exports = {
  createListRefreshMixin
}