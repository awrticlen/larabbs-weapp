const { diffForHumans } = require('./time')

const DEFAULT_AVATAR = '/assets/images/user.png'

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

module.exports = {
  normalizeTopic
}