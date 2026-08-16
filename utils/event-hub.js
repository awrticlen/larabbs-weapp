const listeners = Object.create(null)

const on = (eventName, listener) => {
  if (typeof listener !== 'function') {
    return () => {}
  }

  const eventListeners = listeners[eventName] || []
  eventListeners.push(listener)
  listeners[eventName] = eventListeners

  return () => off(eventName, listener)
}

const off = (eventName, listener) => {
  const eventListeners = listeners[eventName]

  if (!eventListeners) {
    return
  }

  listeners[eventName] = eventListeners.filter((item) => item !== listener)

  if (!listeners[eventName].length) {
    delete listeners[eventName]
  }
}

const emit = (eventName, ...args) => {
  const eventListeners = listeners[eventName]

  if (!eventListeners) {
    return
  }

  eventListeners.slice().forEach((listener) => listener(...args))
}

module.exports = {
  emit,
  off,
  on
}