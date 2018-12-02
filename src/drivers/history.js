const xs = require('xstream').default
const mitt = require('mitt').default

exports.makeHISTORYDriver = () => (history$) => {
  const locationChange = Symbol('locationChange')

  const emitter = mitt()

  window.addEventListener('popstate', function () {
    emitter.emit(locationChange, window.location)
  })

  history$.subscribe({
    next: function (e) {
      let link
      let node = e.target
      while (!link && node !== document.body) {
        if (node.nodeName.toUpperCase() === 'A') link = node
        node = node.parentNode
      }

      e.preventDefault()

      const action = link.getAttribute('replace')
        ? 'replaceState'
        : 'pushState'

      const href = link.getAttribute('href')

      window.history[action](null, document.title, href)

      emitter.emit(locationChange, window.location)
    }
  })

  let sendEvent
  const producer = {
    start: function (listener) {
      sendEvent = (location) => {
        listener.next(location)
      }
      emitter.on(locationChange, sendEvent)
    },
    stop: function () {
      emitter.off(locationChange, sendEvent)
    }
  }

  return function () {
    return xs.create(producer)
      .startWith(window.location)
  }
}
