const { normalizeLoginForm, validateLoginForm } = require('../../utils/validation')

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (data && data.message) {
    return data.message
  }

  if (error && error.message) {
    return error.message
  }

  return '登录失败，请稍后重试'
}

Page({
  data: {
    form: {
      username: '',
      password: ''
    },
    errors: {},
    errorMessage: '',
    submitting: false,
    restoring: false
  },

  handleUsernameInput(event) {
    this.clearFieldError('username', event.detail.value)
  },

  handlePasswordInput(event) {
    this.clearFieldError('password', event.detail.value)
  },

  clearFieldError(field, value) {
    this.setData({
      [`form.${field}`]: value,
      [`errors.${field}`]: '',
      errorMessage: ''
    })
  },

  async submit() {
    if (this.data.submitting) {
      return
    }

    const form = normalizeLoginForm(this.data.form)
    const validation = validateLoginForm(form)

    this.setData({
      form,
      errors: validation.errors,
      errorMessage: validation.firstError
    })

    if (!validation.valid) {
      return
    }

    this.setData({ submitting: true })

    try {
      await getApp().login(form)
      wx.navigateBack()
    } catch (error) {
      this.setData({
        errorMessage: getErrorMessage(error)
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async onShow() {
    const app = getApp()
    const authState = app.syncAuthState()

    if (authState.isLoggedIn) {
      wx.navigateBack()
      return
    }

    if (!authState.accessToken || this.data.restoring) {
      return
    }

    this.setData({ restoring: true })

    try {
      await app.ensureAuth()
      wx.navigateBack()
    } catch (error) {
      // 当前凭证无法恢复时，保留表单供用户重新绑定或登录。
    } finally {
      this.setData({ restoring: false })
    }
  }
})