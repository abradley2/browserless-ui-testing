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

const app = ({ protocol, host, pathname, search, apiURL }) => function app (sources) {
  const getConfigRequest = Symbol('getConfigRequest')
  const getTokenRequest = Symbol('getTokenRequest')

  const queryParams = search.substr(1).split('&').reduce((params, pair) => {
    const [k, v] = pair.split('=')
    return Object.assign({}, params, {
      [k]: v
    })
  }, {})

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
        : xs.empty()
    )
    .filter(v => !!v)

  const tokenResponse$ = sources.HTTP.select(getTokenRequest)
    .flatten()
    .map(data => {
      return data.body && data.body.response && data.body.response.access_token
    })
    // TODO: handle errors here
    .filter(payload => !!payload.token)

  // single stream that fires when the user is logged in either
  // via resuming session via cookie or authentication
  const token$ = xs
    .merge(
      tokenCookie$.filter(token => !!token),
      tokenResponse$.map(payload => payload.token)
    )
    .take(1)

  const config$ = sources.HTTP.select(getConfigRequest)
    .flatten()
    .map(response => {
      const redirectURL = `${protocol}//${host}`
      const config = response.body
      const oauthURL = config.oauthURL + '&redirect_url=' + redirectURL
      return Object.assign(
        {},
        response.body,
        { oauthURL }
      )
    })
    .take(1)

  // used to attempt to get and set the cookie
  const cookie$ = xs
    .merge(
      xs.of({
        name: 'token'
      }),
      tokenResponse$
        .map(token => {
          return {
            name: 'token',
            value: token,
            expires: 60 * 60 * 24 // expire after a day
          }
        })
    )

  const beerSearchSinks = require('./beer-search')({
    DOM: sources.DOM,
    route: route$
      .map(route =>
        Object.assign({}, route, { active: route.name === beerSearchRoute }))
  })

  const homeModel$ = require('./home').intent({
    DOM: sources.DOM,
    HTTP: sources.HTTP,
    route: route$
      .map((route) =>
        Object.assign({}, route, { active: route.name === homeRoute }))
  })
  const homeSinks = require('./home').sinks({
    model: homeModel$,
    config: config$,
    token: token$
  })

  const homeVdom$ = homeSinks.DOM
  const beerSearchVdom$ = beerSearchSinks.DOM

  const vdom$ = route$
    .map(
      (route) => {
        console.log('ROUTE CHANGE: ', route)
        switch (route.name) {
          case homeRoute:
            console.log('home route')
            return homeVdom$
          case beerSearchRoute:
            console.log('beer route')
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

  return {
    DOM: vdom$,
    HTTP: xs.merge(
      requests$,
      homeSinks.HTTP
    ),
    COOKIE: cookie$
  }
}

module.exports = {
  app,
  homeRoute,
  beerSearchRoute
}
