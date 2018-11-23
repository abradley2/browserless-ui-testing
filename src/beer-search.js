const xs = require('xstream').default
const h = require('@cycle/dom')
const textField = require('./components/text-field')

function onMessage (state, message) {
  switch (message.type) {
    case 'textInputValueChanged':
      return Object.assign({}, state, {
        textFieldValue: message.value
      })
    default:
      return state
  }
}

module.exports = function beerSearch (sources) {
  const routeChange = Symbol('route-change')

  const initialState = {
    textFieldValue: 'hello there'
  }

  const state$ = xs
    .merge(
      sources.route
        .map(v => Object.assign({}, v, { routeChange })),
      textField
        .value(sources, '.my-text-field')
        .map(value => ({
          type: 'textInputValueChanged',
          value
        }))
    )
    .fold(onMessage, initialState)
    .startWith(initialState)

  const TextField = textField({
    DOM: sources.DOM,
    props: state$
      .map(
        state => ({
          value: state.textFieldValue
        })
      )
  }, '.my-text-field')

  const vdom$ = xs
    .combine(
      state$,
      TextField.DOM
    )
    .map(
      ([state, textFieldVdom$]) =>
        h.div([
          h.span('Hello from beer search'),
          h.div([
            textFieldVdom$,
            h.h1(state.textFieldValue)
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

  return { DOM: vdom$ }
}
