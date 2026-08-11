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

module.exports = {
  normalizeLoginForm,
  validateLoginForm
}