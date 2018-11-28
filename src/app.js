const xs = require('xstream').default
const h = require('@cycle/dom')
const p2re = require('path-to-regexp')
const memoizee = require('memoizee')
const routes = require('./routes')

const pathToRoute = memoizee(function pathToRoute (pathname) {
  return [
    [p2re('/'), routes.homeRoute],
    [p2re('/beersearch'), routes.beerSearchRoute]
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
        { name: routes.notFoundRoute },
        pathToRoute(e.target.getAttribute
          ? e.target.getAttribute('href')
          : e.target.href),
        e.target.href.split('?')[1]
      )
    })
    .startWith(Object.assign(
      { name: routes.notFoundRoute },
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
    .filter(payload => !!payload.token)

  const token$ = xs
    .merge(
      tokenCookie$.filter(token => !!token),
      tokenResponse$.map(payload => payload.token).filter(token => !!token)
    )
    .startWith(null)
    .take(2)

  const config$ = sources.HTTP.select(getConfigRequest)
    .flatten()
    .map(response => {
      const redirectURL = `${protocol}//${host}`
      const config = response.body
      const oauthURL = config.oauthURL + '&redirect_url=' + redirectURL
      return Object.assign(
        {},
        response.body,
        {
          oauthURL,
          apiURL
        }
      )
    })
    .startWith(null)
    .take(2)

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
            expires: 1
          }
        })
    )

  const beerSearchModel$ = require('./beer-search').intent({
    DOM: sources.DOM,
    HTTP: sources.HTTP,
    route: route$
  })
  const beerSearchSinks = require('./beer-search').sinks({
    model: beerSearchModel$,
    config: config$,
    token: token$,
    route: route$
  })

  const homeModel$ = require('./home').intent({
    DOM: sources.DOM,
    HTTP: sources.HTTP,
    route: route$
  })
  const homeSinks = require('./home').sinks({
    model: homeModel$,
    config: config$,
    token: token$,
    route: route$
  })

  const homeVdom$ = homeSinks.DOM
  const beerSearchVdom$ = beerSearchSinks.DOM

  const vdom$ = route$
    .map(
      route => {
        return xs.merge(
          homeVdom$,

          beerSearchVdom$,

          xs.of(
            h.div([
              h.h1('page not found')
            ])
          ).filter(() => route.name === routes.notFoundRoute)
        )
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
  app
}
