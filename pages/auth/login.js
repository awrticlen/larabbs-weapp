const { login } = require('../../api/auth')
const { hasValidToken, saveToken } = require('../../utils/auth')
const { login: getLoginCode } = require('../../utils/wechat')

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (data && data.message) {
    return data.message
  }

  return '登录失败，请稍后重试'
}

const loginWithCode = async (credentials = {}) => {
  const loginData = await getLoginCode()

  if (!loginData.code) {
    throw new Error('微信登录没有返回 code')
  }

  return login({
    ...credentials,
    code: loginData.code
  })
}

Page({
  data: {
    form: {
      username: '',
      password: ''
    },
    hasError: false,
    errorMessage: '',
    submitting: false
  },

  handleUsernameInput(event) {
    this.setData({
      'form.username': event.detail.value
    })
  },

  handlePasswordInput(event) {
    this.setData({
      'form.password': event.detail.value
    })
  },

  async submit() {
    const { username, password } = this.data.form

    this.setData({
      hasError: false,
      errorMessage: ''
    })

    if (!username || !password) {
      this.setData({
        hasError: true,
        errorMessage: '请填写账户名和密码'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const response = await loginWithCode({ username, password })
      saveToken(response.data)
      wx.navigateBack()
    } catch (error) {
      this.setData({
        hasError: true,
        errorMessage: getErrorMessage(error)
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async onShow() {
    if (hasValidToken()) {
      wx.navigateBack()
      return
    }

    try {
      const response = await loginWithCode()
      saveToken(response.data)
      wx.navigateBack()
    } catch (error) {
      // 未绑定用户时，接口会返回错误；此时保留登录表单。
    }
  }
})