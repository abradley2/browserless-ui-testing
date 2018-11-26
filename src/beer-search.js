const xs = require('xstream').default
const h = require('@cycle/dom')
const routes = require('./routes')
const layout = require('./layout')

const messages = {
  pageShown: Symbol('pageShown')
}

const initialState = {
  active: false,
  beerSearchQuery: ''
}

function model (state, message) {
  if (message.type === messages.pageShown) {
    return Object.assign({}, initialState, { active: message.active })
  }

  switch (message.type) {
    default:
      return state
  }
}

function intent (sources) {
  return xs
    .merge(
      sources.route.map(
        route => ({
          type: messages.pageShown,
          active: route.name === routes.beerSearchRoute
        })
      )
    )
    .fold(model, initialState)
}

function view (sources) {
  const vdom$ = xs
    .combine(
      sources.route,
      sources.model,
      sources.token,
      sources.config
    )
    .filter(([route]) => route.name === routes.beerSearchRoute)
    .map(
      ([state, textFieldVdom$]) => layout(
        h.div([
          h.span('Hello from beer search'),
          h.div([
            h.h1(state.beerSearchQuery)
          ]),
          h.hr(),
          h.div([
            h.a({
              attrs: {
                'data-link': true,
                href: '/'
              }
            }, 'I feel so broke up, i wanna go home')
          ])
        ])
      )
    )

  return vdom$
}

function sinks (sources) {
  return {
    DOM: view(sources)
  }
}

module.exports = {
  view,
  intent,
  sinks,
  messages
}
