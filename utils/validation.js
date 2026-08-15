const loginRules = [
  {
    field: 'username',
    message: '请输入手机号或邮箱',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0
  },
  {
    field: 'username',
    message: '用户名长度不能超过 255 个字符',
    isValid: (value) => typeof value === 'string' && value.trim().length <= 255
  },
  {
    field: 'password',
    message: '请填写密码',
    isValid: (value) => typeof value === 'string' && value.length > 0
  },
  {
    field: 'password',
    message: '密码最少 6 位数',
    isValid: (value) => typeof value === 'string' && value.length >= 6
  }
]

const validateLoginForm = (form = {}) => {
  const errors = {}

  loginRules.some((rule) => {
    if (errors[rule.field] || rule.isValid(form[rule.field])) {
      return false
    }

    errors[rule.field] = rule.message
    return false
  })

  const firstError = Object.keys(errors)
    .map((field) => errors[field])
    .find(Boolean) || ''

  return {
    errors,
    firstError,
    valid: Object.keys(errors).length === 0
  }
}

const normalizeLoginForm = (form = {}) => ({
  username: typeof form.username === 'string' ? form.username.trim() : '',
  password: typeof form.password === 'string' ? form.password : ''
})

const mobilePattern = /^1[3-9]\d{9}$/

const phoneRules = [
  {
    field: 'phone',
    message: '请输入手机号',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0
  },
  {
    field: 'phone',
    message: '手机号格式不正确',
    isValid: (value) => mobilePattern.test((value || '').trim())
  }
]

const validatePhoneForm = (form = {}) => {
  const errors = {}

  phoneRules.some((rule) => {
    if (errors[rule.field] || rule.isValid(form[rule.field])) {
      return false
    }

    errors[rule.field] = rule.message
    return false
  })

  const firstError = Object.keys(errors)
    .map((field) => errors[field])
    .find(Boolean) || ''

  return {
    errors,
    firstError,
    valid: Object.keys(errors).length === 0
  }
}

const normalizePhoneForm = (form = {}) => ({
  phone: typeof form.phone === 'string' ? form.phone.trim() : ''
})

const registrationNamePattern = /^[A-Za-z0-9_-]+$/

const registrationRules = [
  {
    field: 'phone',
    message: '请输入手机号',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0
  },
  {
    field: 'phone',
    message: '手机号格式不正确',
    isValid: (value) => mobilePattern.test((value || '').trim())
  },
  {
    field: 'verification_code',
    message: '请输入验证码',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0
  },
  {
    field: 'name',
    message: '请输入姓名',
    isValid: (value) => typeof value === 'string' && value.trim().length > 0
  },
  {
    field: 'name',
    message: '姓名必须介于 3 - 25 个字符之间',
    isValid: (value) => {
      const name = (value || '').trim()
      return name.length >= 3 && name.length <= 25
    }
  },
  {
    field: 'name',
    message: '姓名只支持英文、数字、横杆和下划线',
    isValid: (value) => registrationNamePattern.test((value || '').trim())
  },
  {
    field: 'password',
    message: '请填写密码',
    isValid: (value) => typeof value === 'string' && value.length > 0
  },
  {
    field: 'password',
    message: '密码最少 6 位数',
    isValid: (value) => typeof value === 'string' && value.length >= 6
  }
]

const validateRegistrationForm = (form = {}) => {
  const errors = {}

  registrationRules.forEach((rule) => {
    if (!errors[rule.field] && !rule.isValid(form[rule.field])) {
      errors[rule.field] = rule.message
    }
  })

  const firstError = Object.keys(errors)
    .map((field) => errors[field])
    .find(Boolean) || ''

  return {
    errors,
    firstError,
    valid: Object.keys(errors).length === 0
  }
}

const normalizeRegistrationForm = (form = {}) => ({
  phone: typeof form.phone === 'string' ? form.phone.trim() : '',
  verification_code: typeof form.verification_code === 'string' ? form.verification_code.trim() : '',
  name: typeof form.name === 'string' ? form.name.trim() : '',
  password: typeof form.password === 'string' ? form.password : ''
})

module.exports = {
  normalizeLoginForm,
  normalizePhoneForm,
  normalizeRegistrationForm,
  validateLoginForm,
  validatePhoneForm,
  validateRegistrationForm
}