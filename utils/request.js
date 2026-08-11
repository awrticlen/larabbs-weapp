const BASE_URL = 'http://larabbs.test/api/v1'

const getErrorMessage = (response) => {
  const data = response && response.data
  return data && data.message ? data.message : '请求失败，请稍后重试'
}

const showStatusMessage = (response) => {
  if (response.statusCode === 429) {
    wx.showModal({
      title: '提示',
      content: '请求太频繁，请稍后再试',
      showCancel: false
    })
  }

  if (response.statusCode >= 500) {
    wx.showModal({
      title: '提示',
      content: '服务器错误，请联系管理员或重试',
      showCancel: false
    })
  }
}

const request = (path, options = {}, showLoading = true) => {
  if (showLoading) {
    wx.showLoading({ title: '加载中' })
  }

  const url = `${BASE_URL}/${path.replace(/^\/+/, '')}`

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response)
          return
        }

        showStatusMessage(response)
        const error = new Error(getErrorMessage(response))
        error.response = response
        reject(error)
      },
      fail(error) {
        reject(error)
      },
      complete() {
        if (showLoading) {
          wx.hideLoading()
        }
      }
    })
  })
}

module.exports = {
  request
}