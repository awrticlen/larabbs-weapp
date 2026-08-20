const { deleteReply: deleteReplyRequest } = require('../../api/reply')
const eventHub = require('../../utils/event-hub')

const normalizeId = (value) => {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

const getErrorMessage = (error) => {
  const response = error && error.response
  const statusCode = response && response.statusCode
  const data = response && response.data

  if (statusCode === 403) {
    return '没有权限删除该回复'
  }

  if (data && typeof data.message === 'string' && data.message) {
    return data.message
  }

  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }

  return '删除回复失败，请稍后重试'
}

Component({
  properties: {
    reply: {
      type: Object,
      value: {},
      observer: 'syncCanDelete'
    },
    canManageTopic: {
      type: Boolean,
      value: false,
      observer: 'syncCanDelete'
    }
  },

  data: {
    canDelete: false,
    deleting: false,
    errorMessage: ''
  },

  attached() {
    this.permissionsUpdatedHandler = () => this.syncCanDelete()
    eventHub.on('permissions-updated', this.permissionsUpdatedHandler)
    this.syncCanDelete()
  },

  detached() {
    eventHub.off('permissions-updated', this.permissionsUpdatedHandler)
  },

  methods: {
    syncCanDelete() {
      const app = getApp()
      const authState = app.syncAuthState()
      const currentUserId = normalizeId(authState.user && authState.user.id)
      const replyUserId = normalizeId(this.data.reply && this.data.reply.userId)
      const canManageContents = typeof app.can === 'function' && app.can('manage_contents')

      this.setData({
        canDelete: Boolean(
          authState.isLoggedIn
            && currentUserId
            && (currentUserId === replyUserId || canManageContents || this.data.canManageTopic)
        )
      })
    },

    async handleDelete() {
      const reply = this.data.reply || {}
      const topicId = normalizeId(reply.topicId)
      const replyId = normalizeId(reply.id)

      if (!this.data.canDelete || this.data.deleting || !topicId || !replyId) {
        return
      }

      const modal = await wx.showModal({
        title: '确认删除',
        content: '您确认删除该回复吗？',
        confirmText: '删除',
        cancelText: '取消'
      })

      if (!modal.confirm) {
        return
      }

      this.setData({
        deleting: true,
        errorMessage: ''
      })

      try {
        await deleteReplyRequest(topicId, replyId)
        eventHub.emit('reply-deleted', reply)
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
      } catch (error) {
        this.setData({
          errorMessage: getErrorMessage(error)
        })
      } finally {
        this.setData({ deleting: false })
      }
    }
  }
})