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
const loadSessionToken = Symbol('loadSessionToken')
const tokenResponse = Symbol('tokenResponse')

function setToken (state, message) {
  const currentUser = state.user || {}
  const updatedUser = Object.assign({}, currentUser, {
    token: message.token
  })
  return Object.assign({}, state, {
    user: updatedUser
  })
}

function onMessage (state, message) {
  switch (message.type) {
    case tokenResponse:
      return setToken(state, message)
    case loadSessionToken:
      return setToken(state, message)
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
  const getTokenRequest = Symbol('getTokenRequest')

  const queryParams = search.substr(1).split('&').reduce((params, pair) => {
    const [k, v] = pair.split('=')
    return Object.assign({}, params, {
      [k]: v
    })
  }, {})

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

  const tokenCookie$ = sources.COOKIE.select('token')

  const requests$ = xs
    .merge(
      xs.of({
        url: `${apiURL}config`,
        category: getConfigRequest
      }),
      queryParams.code
        ? tokenCookie$.map(
          token => {
            // if we have a token from the cookie then don't fire off the request
            return token
              ? null
              : {
                url: `${apiURL}token`,
                category: getTokenRequest,
                method: 'POST',
                send: {
                  code: queryParams.code,
                  redirectUrl: `${protocol}//${host}`
                }
              }
          }
        )
        : xs.of()
    )
    .filter(v => !!v)

  const tokenResponse$ = sources.HTTP.select(getTokenRequest)
    .flatten()
    .map(data => {
      return {
        type: tokenResponse,
        token: data.body && data.body.response && data.body.response.access_token
      }
    })
    // TODO: handle errors here
    .filter(payload => !!payload.token)

  const session$ = xs
    .merge(
      route$,

      tokenCookie$
        .filter(token => !!token)
        .map(token => {
          return {
            type: loadSessionToken,
            token
          }
        }),

      tokenResponse$,

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
    .merge(
      xs.of({
        name: 'token'
      }),
      tokenResponse$
        .map(payload => {
          return {
            name: 'token',
            value: payload.token,
            expires: 60 * 60 * 24 // expire after a day
          }
        })
    )

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

  const vdom$ = xs
    .combine(
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
