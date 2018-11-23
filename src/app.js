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

function onMessage (state, message) {
  switch (message.type) {
    default:
      return state
  }
}

const app = ({ pathname, search }) => function app (sources) {
  const initialState = {
    user: null
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

  const session$ = xs
    .merge(
      route$
    )
    .fold(onMessage, initialState)

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

  const vdom$ = route$
    .map(
      route => {
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

  return { DOM: vdom$ }
}

module.exports = {
  app,
  homeRoute,
  beerSearchRoute
}
