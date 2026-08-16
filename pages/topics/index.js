const { getCategories, getTopics } = require('../../api/topic')
const { normalizeTopic } = require('../../utils/topic')
const { createListRefreshMixin } = require('../../mixins/list-refresh')

const listRefresh = createListRefreshMixin({
  fetchPage: ({ page, pageInstance }) => {
    const categoryId = pageInstance.data.currentCategoryId

    return getTopics({
      page,
      include: 'user,category',
      ...(categoryId ? { 'filter[category_id]': categoryId } : {})
    })
  },
  normalizeItem: normalizeTopic,
  fallbackErrorMessage: '获取话题失败，请稍后重试'
})

const CATEGORY_STORAGE_KEY = 'categories'

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

Page({
  ...listRefresh,

  data: {
    ...listRefresh.data,
    categories: [],
    currentCategoryId: null,
    currentCategoryName: '话题',
    categoryOpen: false,
    categoryLoading: false,
    categoryErrorMessage: ''
  },

  onLoad() {
    this.loadCategories()
    this.reloadList()
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
      categoryOpen: false
    })

    await this.reloadList({ clear: true })
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
  }
})