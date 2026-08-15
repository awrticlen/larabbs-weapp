const { uploadAvatar: uploadAvatarRequest } = require('../../api/user')
const { normalizeProfileForm, validateProfileForm } = require('../../utils/validation')

const toErrorText = (value) => {
  if (typeof value === 'string' && value) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(toErrorText).find(Boolean) || ''
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .map((key) => toErrorText(value[key]))
      .find(Boolean) || ''
  }

  return ''
}

const getValidationErrors = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (!response || response.statusCode !== 422 || !data || !data.errors) {
    return null
  }

  return Object.keys(data.errors).reduce((errors, field) => {
    const message = toErrorText(data.errors[field])

    if (message) {
      errors[field] = message
    }

    return errors
  }, {})
}

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  return toErrorText(data && data.message)
    || toErrorText(data && data.errors)
    || (error && error.message)
    || '修改失败，请稍后重试'
}

Page({
  data: {
    form: {
      name: '',
      email: '',
      introduction: '',
      avatar: '',
      avatar_image_id: ''
    },
    errors: {},
    errorMessage: '',
    uploadingAvatar: false,
    submitting: false
  },

  onShow() {
    const authState = getApp().syncAuthState()

    if (!authState.isLoggedIn || !authState.user) {
      wx.switchTab({
        url: '/pages/users/me'
      })
      return
    }

    this.setData({
      form: normalizeProfileForm(authState.user),
      errors: {},
      errorMessage: ''
    })
  },

  handleInput(event) {
    const { field } = event.currentTarget.dataset

    this.setData({
      [`form.${field}`]: event.detail.value,
      [`errors.${field}`]: '',
      errorMessage: ''
    })
  },

  async selectAvatar() {
    if (this.data.uploadingAvatar || this.data.submitting) {
      return
    }

    let image

    try {
      image = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count: 1,
          success: resolve,
          fail: reject
        })
      })
    } catch (error) {
      if (!error || !String(error.errMsg || '').includes('cancel')) {
        this.setData({
          errorMessage: '选择头像失败，请稍后重试'
        })
      }
      return
    }

    const [filePath] = image.tempFilePaths || []
    if (!filePath) {
      this.setData({
        errorMessage: '没有获取到头像图片'
      })
      return
    }

    this.setData({
      uploadingAvatar: true,
      errorMessage: ''
    })

    try {
      const response = await uploadAvatarRequest(filePath)
      const imageData = response.data || {}

      if (!imageData.id || !imageData.path) {
        throw new Error('头像上传响应不完整')
      }

      this.setData({
        'form.avatar': imageData.path,
        'form.avatar_image_id': imageData.id
      })
    } catch (error) {
      this.setData({
        errorMessage: getErrorMessage(error)
      })
    } finally {
      this.setData({ uploadingAvatar: false })
    }
  },

  async submit() {
    if (this.data.submitting || this.data.uploadingAvatar) {
      return
    }

    const form = normalizeProfileForm(this.data.form)
    const validation = validateProfileForm(form)

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
      const user = await getApp().updateCurrentUser(form)

      this.setData({
        form: normalizeProfileForm(user),
        errors: {},
        errorMessage: ''
      })
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      })
    } catch (error) {
      const errors = getValidationErrors(error)

      this.setData(errors
        ? { errors, errorMessage: '' }
        : { errorMessage: getErrorMessage(error) })
    } finally {
      this.setData({ submitting: false })
    }
  }
})