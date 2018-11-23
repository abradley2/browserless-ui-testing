const xs = require('xstream').default
const h = require('@cycle/dom')

module.exports = function home (sources) {
  const initialState = {

  }

  const state$ = xs
    .combine(
      sources.route
    )
    .fold((state, [route, cur]) => {
      if (!route.active) return null

      return {

      }
    }, initialState)

  const vdom$ = state$.map(state =>
    h.div([
      h.div('Hello there'),
      h.div([
        h.a({
          attrs: {
            'data-link': true,
            href: '/beersearch'
          }
        }, 'go to beer search')
      ])
    ]))

  return { DOM: vdom$ }
}
