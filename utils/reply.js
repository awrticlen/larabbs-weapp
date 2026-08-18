const { diffForHumans } = require('./time')

const DEFAULT_AVATAR = '/assets/images/user.png'

const normalizeUserId = (value) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeReply = (reply = {}) => {
  const user = reply.user || {}
  const topic = reply.topic || {}
  const avatar = typeof user.avatar === 'string' ? user.avatar : ''

  return {
    id: reply.id,
    userId: normalizeUserId(reply.user_id || user.id),
    userName: typeof user.name === 'string' && user.name ? user.name : '匿名用户',
    topicId: normalizeUserId(reply.topic_id || topic.id),
    topicTitle: typeof topic.title === 'string' && topic.title ? topic.title : '未命名话题',
    avatar: avatar && !/\.svg(?:$|\?)/i.test(avatar) ? avatar : DEFAULT_AVATAR,
    content: typeof reply.content === 'string' ? reply.content : '',
    createdAtText: diffForHumans(reply.created_at)
  }
}

module.exports = {
  normalizeReply
}