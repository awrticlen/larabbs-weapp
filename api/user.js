const { authRequest, request, uploadFile } = require('../utils/request')

const getUser = (id) => request(`users/${id}`, {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
})

const getCurrentUser = () => authRequest('user', {
  method: 'GET',
  header: {
    Accept: 'application/json'
  }
})

const updateCurrentUser = (data) => authRequest('user', {
  method: 'PUT',
  header: {
    Accept: 'application/json'
  },
  data
})

const uploadAvatar = (filePath) => uploadFile('images', {
  filePath,
  name: 'image',
  formData: {
    type: 'avatar'
  },
  header: {
    Accept: 'application/json'
  }
})

module.exports = {
  getUser,
  getCurrentUser,
  updateCurrentUser,
  uploadAvatar
}