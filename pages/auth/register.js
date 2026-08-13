const { getCaptcha } = require('../../api/auth')
const { normalizePhoneForm, validatePhoneForm } = require('../../utils/validation')

const getErrorMessage = (error) => {
  const response = error && error.response
  const data = response && response.data

  if (response && response.statusCode === 422 && data && data.errors) {
    return data.errors
  }

  return null
}

Page({
  data: {
    form: {
      phone: ''
    },
    phoneDisabled: false,
    errors: {},
    errorMessage: '',
    captchaCode: '',
    captcha: {},
    captchaModalShow: false,
    requestingCaptcha: false,
    submitting: false
  },

  handlePhoneInput(event) {
    this.setData({
      'form.phone': event.detail.value,
      'errors.phone': '',
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
      captchaCode: ''
    })
  },

  async getCaptchaCode() {
    if (this.data.requestingCaptcha) {
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
        captchaCode: ''
      })
    } catch (error) {
      const validationErrors = getErrorMessage(error)

      if (validationErrors) {
        this.setData({
          errors: {
            phone: (validationErrors.phone && validationErrors.phone[0]) || ''
          }
        })
      } else {
        this.setData({
          errorMessage: (error.response && error.response.data && error.response.data.message) || '获取验证码失败，请稍后重试'
        })
      }
    } finally {
      this.setData({ requestingCaptcha: false })
    }
  },

  sendVerificationCode() {
    if (!this.data.captchaCode) {
      this.setData({
        'errors.captchaCode': '请输入图片验证码'
      })
      return
    }

    // 下一节将在这里请求短信验证码接口。
    this.setData({
      captchaModalShow: false
    })
  },

  submit() {
    // 短信验证码及提交注册逻辑将在后续小节补充。
  }
})
