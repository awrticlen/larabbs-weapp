const parseDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    const timestamp = value < 100000000000 ? value * 1000 : value
    const date = new Date(timestamp)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const text = value.trim()
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
  )

  if (match) {
    const [, year, month, day, hour = '0', minute = '0', second = '0', millisecond = '0'] = match
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millisecond.padEnd(3, '0'))
    )

    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

const diffForHumans = (value, now = Date.now()) => {
  const date = parseDate(value)

  if (!date) {
    return typeof value === 'string' ? value : ''
  }

  const difference = Math.max(0, now - date.getTime())
  const seconds = Math.floor(difference / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return '刚刚'
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  if (hours < 24) {
    return `${hours} 小时前`
  }

  if (days < 30) {
    return `${days} 天前`
  }

  if (months < 12) {
    return `${months} 个月前`
  }

  return `${years} 年前`
}

module.exports = {
  diffForHumans,
  parseDate
}