Component({
  properties: {
    replies: {
      type: Array,
      value: []
    },
    noMoreData: {
      type: Boolean,
      value: false
    },
    showNoMore: {
      type: Boolean,
      value: false
    },
    showTopic: {
      type: Boolean,
      value: false
    },
    canManageTopic: {
      type: Boolean,
      value: false
    }
  }
})