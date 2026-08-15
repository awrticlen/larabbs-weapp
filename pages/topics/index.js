const { diffForHumans } = require('../../utils/time')
const { getCategories, getTopics } = require('../../api/topic')

const CATEGORY_STORAGE_KEY = 'categories'
const DEFAULT_AVATAR = '/assets/images/user.png'

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

const normalizeCategoryId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeCategories = (categories) => (Array.isArray(categories) ? categories : [])
  .map((category) => ({
    id: normalizeCategoryId(category && category.id),
    name: typeof (category && category.name) === 'string' ? category.name : ''
  }))
  .filter((category) => category.id && category.name)

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

const getTopicParams = (page, categoryId) => ({
  page,
  include: 'user,category',
  ...(categoryId ? { 'filter[category_id]': categoryId } : {})
})

Page({
  data: {
    categories: [],
    currentCategoryId: null,
    currentCategoryName: '话题',
    categoryOpen: false,
    categoryLoading: false,
    categoryErrorMessage: '',
    topics: [],
    page: 1,
    noMoreData: false,
    isLoading: false,
    errorMessage: ''
  },

  onLoad() {
    this.loadCategories()
    this.loadTopics({ reset: true })
  },

  async onPullDownRefresh() {
    try {
      await this.loadTopics({ reset: true, page: 1 })
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

  toggleCategories() {
    this.setData({
      categoryOpen: !this.data.categoryOpen,
      categoryErrorMessage: ''
    })
  },

  async selectCategory(event) {
    const categoryId = normalizeCategoryId(event.currentTarget.dataset.id)
    const categoryName = categoryId ? event.currentTarget.dataset.name : '话题'

    if (categoryId === this.data.currentCategoryId) {
      this.setData({ categoryOpen: false })
      return
    }

    this.setData({
      currentCategoryId: categoryId,
      currentCategoryName: categoryName || '话题',
      categoryOpen: false,
      topics: [],
      page: 1,
      noMoreData: false,
      errorMessage: ''
    })

    await this.loadTopics({
      reset: true,
      page: 1,
      categoryId
    })
  },

  async loadCategories() {
    const cachedCategories = normalizeCategories(wx.getStorageSync(CATEGORY_STORAGE_KEY))

    if (cachedCategories.length) {
      this.setData({ categories: cachedCategories })
      return cachedCategories
    }

    this.setData({
      categoryLoading: true,
      categoryErrorMessage: ''
    })

    try {
      const response = await getCategories()
      const categories = normalizeCategories(response.data && response.data.data)

      wx.setStorageSync(CATEGORY_STORAGE_KEY, categories)
      this.setData({ categories })

      return categories
    } catch (error) {
      this.setData({
        categoryErrorMessage: getErrorMessage(error, '获取分类失败，请稍后重试')
      })

      return []
    } finally {
      this.setData({ categoryLoading: false })
    }
  },

  async loadTopics({
    reset = false,
    page = this.data.page,
    categoryId = this.data.currentCategoryId
  } = {}) {
    const requestId = (this.topicRequestId || 0) + 1
    this.topicRequestId = requestId

    this.setData({
      isLoading: true,
      errorMessage: ''
    })

    try {
      const response = await getTopics(getTopicParams(page, categoryId))

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
        this.setData({
          errorMessage: getErrorMessage(error, '获取话题失败，请稍后重试')
        })
      }

      return false
    } finally {
      if (requestId === this.topicRequestId) {
        this.setData({ isLoading: false })
      }
    }
  }
})