const { run } = require('@cycle/run')
const { makeDOMDriver } = require('@cycle/dom')
const { makeHTTPDriver } = require('@cycle/http')
const { makeCOOKIEDriver } = require('./drivers/cookie')
const { app } = require('./app')

run(
  app(
    Object.assign({},
      window.location,
      {
        apiURL: window.location.hostname.includes('localhost')
          ? 'http://localhost:8080/'
          : '/'
      })
  ),
  {
    DOM: makeDOMDriver(document.getElementById('app')),
    HTTP: makeHTTPDriver(),
    COOKIE: makeCOOKIEDriver()
  }
)
