const { diffForHumans } = require('./time')

const DEFAULT_AVATAR = '/assets/images/user.png'

const normalizeId = (value) => {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

const normalizeAvatar = (value) => {
  if (typeof value !== 'string' || !value || /\.svg(?:$|\?)/i.test(value)) {
    return DEFAULT_AVATAR
  }

  return value
}

const normalizeNotification = (notification = {}) => {
  const data = notification.data && typeof notification.data === 'object'
    ? notification.data
    : {}
  const userId = normalizeId(data.user_id)
  const topicId = normalizeId(data.topic_id)
  const userName = typeof data.user_name === 'string' && data.user_name
    ? data.user_name
    : '匿名用户'
  const topicTitle = typeof data.topic_title === 'string' && data.topic_title
    ? data.topic_title
    : '未命名话题'

  return {
    id: notification.id || '',
    type: typeof notification.type === 'string' ? notification.type : '',
    userId,
    userName,
    userAvatar: normalizeAvatar(data.user_avatar),
    topicId,
    topicTitle,
    replyContent: typeof data.reply_content === 'string' ? data.reply_content : '',
    createdAtText: diffForHumans(notification.created_at),
    readAt: notification.read_at || null,
    isRead: Boolean(notification.read_at)
  }
}

module.exports = {
  normalizeNotification
}