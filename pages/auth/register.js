const { getCaptcha, getVerificationCode } = require('../../api/auth')
const { normalizePhoneForm, normalizeRegistrationForm, validatePhoneForm, validateRegistrationForm } = require('../../utils/validation')

const getValidationErrors = (error) => {
  const response = error && error.response
  const data = response && response.data

  return response && response.statusCode === 422 && data && data.errors
    ? data.errors
    : null
}

const toErrorText = (value) => {
  if (typeof value === 'string' && value) {
    return value
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const message = toErrorText(value[index])
      if (message) {
        return message
      }
    }
  }

  if (value && typeof value === 'object') {
    const fields = Object.keys(value)
    for (let index = 0; index < fields.length; index += 1) {
      const message = toErrorText(value[fields[index]])
      if (message) {
        return message
      }
    }
  }

  return ''
}

const normalizeErrors = (errors = {}) => Object.keys(errors).reduce((result, field) => {
  const message = toErrorText(errors[field])
  if (message) {
    result[field] = message
  }
  return result
}, {})

const getErrorMessage = (error, fallback) => {
  const response = error && error.response
  const data = response && response.data
  const responseMessage = toErrorText(data && data.message) || toErrorText(data && data.errors)

  if (responseMessage) {
    return responseMessage
  }

  if (error && typeof error.errMsg === 'string' && error.errMsg) {
    return error.errMsg
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return fallback
}

Page({
  data: {
    form: {
      phone: '',
      verification_code: '',
      name: '',
      password: ''
    },
    phoneDisabled: false,
    errors: {},
    errorMessage: '',
    captchaCode: '',
    captcha: {},
    verificationCode: {},
    captchaModalShow: false,
    requestingCaptcha: false,
    sendingVerificationCode: false,
    submitting: false
  },

  handlePhoneInput(event) {
    this.setData({
      'form.phone': event.detail.value,
      'errors.phone': '',
      errorMessage: ''
    })
  },

  handleVerificationCodeInput(event) {
    this.setData({
      'form.verification_code': event.detail.value,
      'errors.verification_code': '',
      errorMessage: ''
    })
  },

  handleNameInput(event) {
    this.setData({
      'form.name': event.detail.value,
      'errors.name': '',
      errorMessage: ''
    })
  },

  handlePasswordInput(event) {
    this.setData({
      'form.password': event.detail.value,
      'errors.password': '',
      errorMessage: ''
    })
  },

  handleCaptchaCodeInput(event) {
    this.setData({
      captchaCode: event.detail.value,
      'errors.captchaCode': ''
    })
  },

  closeCaptchaModal() {
    this.setData({
      captchaModalShow: false,
      captchaCode: '',
      'errors.captchaCode': ''
    })
  },

  async getCaptchaCode(captchaErrorMessage = '', force = false) {
    const captchaError = typeof captchaErrorMessage === 'string'
      ? captchaErrorMessage
      : ''

    if (
      this.data.phoneDisabled ||
      this.data.requestingCaptcha ||
      (this.data.sendingVerificationCode && !force)
    ) {
      return
    }

    const form = normalizePhoneForm(this.data.form)
    const validation = validatePhoneForm(form)

    this.setData({
      form,
      errors: validation.errors,
      errorMessage: ''
    })

    if (!validation.valid) {
      return
    }

    this.setData({ requestingCaptcha: true })

    try {
      const response = await getCaptcha(form.phone)

      this.setData({
        captcha: {
          key: response.data.captcha_key,
          imageContent: response.data.captcha_image_content,
          expiredAt: Date.parse(response.data.expired_at)
        },
        captchaModalShow: true,
        captchaCode: '',
        errors: captchaError ? { captchaCode: captchaError } : {},
        errorMessage: ''
      })
    } catch (error) {
      const validationErrors = getValidationErrors(error)

      if (validationErrors) {
        this.setData({
          errors: {
            phone: toErrorText(validationErrors.phone)
          }
        })
      } else {
        this.setData({
          errorMessage: getErrorMessage(error, '获取图片验证码失败，请稍后重试')
        })
      }
    } finally {
      this.setData({ requestingCaptcha: false })
    }
  },

  async sendVerificationCode() {
    if (this.data.sendingVerificationCode) {
      return
    }

    const captchaCode = this.data.captchaCode.trim()

    if (!captchaCode) {
      this.setData({
        'errors.captchaCode': '请输入图片验证码'
      })
      return
    }

    const expiredAt = Number(this.data.captcha.expiredAt)
    if (!this.data.captcha.key || !Number.isFinite(expiredAt) || Date.now() >= expiredAt) {
      await this.getCaptchaCode('图片验证码已过期，请重新输入', true)
      return
    }

    this.setData({
      captchaCode,
      sendingVerificationCode: true,
      'errors.captchaCode': ''
    })

    try {
      const response = await getVerificationCode(this.data.captcha.key, captchaCode)

      this.setData({
        verificationCode: {
          key: response.data.key,
          expiredAt: Date.parse(response.data.expired_at)
        },
        captchaModalShow: false,
        captchaCode: '',
        phoneDisabled: true,
        errors: {}
      })

      wx.showToast({
        title: '短信验证码已发送',
        icon: 'success'
      })
    } catch (error) {
      await this.getCaptchaCode(getErrorMessage(error, '图片验证码错误，请重新输入'), true)
    } finally {
      this.setData({ sendingVerificationCode: false })
    }
  },

  async submit() {
    if (this.data.submitting) {
      return
    }

    const form = normalizeRegistrationForm(this.data.form)
    const validation = validateRegistrationForm(form)

    this.setData({
      form,
      errors: validation.errors,
      errorMessage: validation.firstError
    })

    if (!validation.valid) {
      return
    }

    const verificationKey = this.data.verificationCode.key
    const verificationExpiredAt = Number(this.data.verificationCode.expiredAt)

    if (!verificationKey) {
      wx.showToast({
        title: '请先发送验证码',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (!Number.isFinite(verificationExpiredAt) || Date.now() >= verificationExpiredAt) {
      wx.showToast({
        title: '验证码已过期，请重新获取',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({
      submitting: true,
      errorMessage: ''
    })

    try {
      await getApp().register({
        ...form,
        verification_key: verificationKey
      })

      wx.showToast({
        title: '注册成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/user/user'
        })
      }, 1500)
    } catch (error) {
      const response = error && error.response
      const statusCode = response && response.statusCode
      const data = response && response.data

      if (statusCode === 401) {
        this.setData({
          errors: {
            verification_code: getErrorMessage(error, '验证码错误')
          }
        })
      } else if (statusCode === 422 && data && data.errors) {
        const errors = normalizeErrors(data.errors)
        this.setData({
          errors,
          errorMessage: getErrorMessage(error, '')
        })
      } else {
        this.setData({
          errorMessage: getErrorMessage(error, '注册失败，请稍后重试')
        })
      }
    } finally {
      this.setData({ submitting: false })
    }
  }
})
