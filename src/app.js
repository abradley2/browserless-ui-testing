const xs = require('xstream').default
const h = require('@cycle/dom')
const p2re = require('path-to-regexp')
const memoizee = require('memoizee')

const home = p2re('/')
const homeRoute = Symbol('homeRoute')

const beerSearch = p2re('/beersearch')
const beerSearchRoute = Symbol('beerSearchRoute')

const pathToRoute = memoizee(function pathToRoute (pathname) {
  return [
    [home, homeRoute],
    [beerSearch, beerSearchRoute]
  ]
    .reduce((found, [curRegExp, curRoute]) => {
      const result = curRegExp.exec(pathname)

      return result
        ? { name: curRoute, params: result.slice(1) }
        : found
    }, null)
})

const configResponse = Symbol('configResponse')
const tokenRecieved = Symbol('tokenRecieved')

function onMessage (state, message) {
  switch (message.type) {
    case tokenRecieved:
      const currentUser = state.user || {}
      const updatedUser = Object.assign({}, currentUser, {
        token: message.token
      })
      return Object.assign({}, state, {
        user: updatedUser
      })
    case configResponse:
      const redirectUrl = encodeURIComponent(message.redirectUrl)
      const config = Object.assign({}, message.config, {
        oauthURL: message.config.oauthURL + '&redirect_url=' + redirectUrl
      })
      return Object.assign({}, state, {
        config
      })
    default:
      return state
  }
}

const app = ({ protocol, host, pathname, search, apiURL }) => function app (sources) {
  const getConfigRequest = Symbol('getConfigRequest')

  const initialState = {
    user: null,
    config: null
  }

  const route$ = sources.DOM.select('a[data-link]').events('click')
    .map(e => {
      // if we are in the browser we need to run some side-effects to facilitate routing
      if (window) {
        e.preventDefault()
        const stateChange = e.target.getAttribute('replace-state')
          ? 'replaceState'
          : 'pushState'
        window.history[stateChange](null, document.title, e.target.getAttribute('href'))
      }

      return Object.assign(
        { name: 'notfound' },
        pathToRoute(e.target.getAttribute
          ? e.target.getAttribute('href')
          : e.target.href),
        e.target.href.split('?')[1]
      )
    })
    .startWith(Object.assign(
      { name: 'notfound' },
      pathToRoute(pathname),
      search
    ))

  const requests$ = xs
    .of({
      url: `${apiURL}config`,
      category: getConfigRequest
    })

  const session$ = xs
    .merge(
      route$,
      sources.COOKIE.select('token')
        .filter(token => !!token)
        .map(token => {
          return {
            type: tokenRecieved,
            token
          }
        }),

      sources.HTTP.select(getConfigRequest)
        .flatten()
        .map(response => {
          return {
            type: configResponse,
            config: response.body,
            redirectUrl: `${protocol}//${host}`
          }
        })
    )
    .fold(onMessage, initialState)

  const cookie$ = xs
    .of({
      name: 'token'
    })

  const beerSearchSinks = require('./beer-search')({
    DOM: sources.DOM,
    session: session$,
    route: route$
      .map(route =>
        Object.assign({}, route, { active: route.name === beerSearchRoute }))
  })

  const homeSinks = require('./home')({
    DOM: sources.DOM,
    session: session$,
    route: route$
      .map((route) =>
        Object.assign({}, route, { active: route.name === homeRoute }))
  })

  const homeVdom$ = homeSinks.DOM
  const beerSearchVdom$ = beerSearchSinks.DOM

  const vdom$ = xs.combine(
    route$,
    session$
  )
    .filter(([route, session]) => session.config)
    .map(
      ([route]) => {
        switch (route.name) {
          case homeRoute:
            return homeVdom$
          case beerSearchRoute:
            return beerSearchVdom$
          default:
            return xs.of(
              h.div([
                h.h1('page not found')
              ])
            )
        }
      }
    )
    .flatten()

  return { DOM: vdom$, HTTP: requests$, COOKIE: cookie$ }
}

module.exports = {
  app,
  homeRoute,
  beerSearchRoute
}
