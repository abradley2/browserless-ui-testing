const xs = require('xstream').default
const mitt = require('mitt').default
const cookies = require('js-cookie')

exports.makeCOOKIEDriver = () => function (cookie$) {
  const cookieRequested = Symbol('cookieRequested')
  const cookieEmitter = mitt()

  let grabCookie
  const cookieProducer = {
    start: function (listener) {
      grabCookie = (cookieName) => {
        listener.next({ name: cookieName, value: cookies.get(cookieName) })
      }
      cookieEmitter.on(cookieRequested, grabCookie)
    },
    stop: function () {
      cookieEmitter.off(cookieRequested, grabCookie)
    }
  }
  cookie$.subscribe({
    next: function (payload) {
      if (Object.keys(payload).includes('value')) {
        cookies.set(payload.name, payload.value, { expires: payload.expires })
        return
      }
      cookieEmitter.emit(cookieRequested, payload.name)
    }
  })
  return {
    select: function (cookieName) {
      return xs
        .create(cookieProducer)
        .filter(payload => payload.name === cookieName)
        .map(payload => payload.value)
    }
  }
}
