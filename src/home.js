const xs = require('xstream').default
const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('./theme')

const classes = StyleSheet.create({
  banner: {
    backgroundColor: theme.beerBrown,
    height: 48,
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0px 16px',
    justifyContent: 'space-around',
    color: 'white'
  },
  banner__title: {
    lineHeight: '48px',
    fontSize: 24,
    fontWeight: 'bolder',
    letterSpacing: 1.2
  },
  banner__beerIcon: {
    fontSize: 32,
    margin: '0px 8px',
    transform: 'translateY(10%)'
  }
})

function onMessage (state, message) {
  switch (message.type) {
    default:
      return state
  }
}

function banner () {
  return h.div({
    attrs: {
      class: css(
        classes.banner
      )
    }
  }, [
    h.span([
      h.i({
        attrs: {
          class: `fas fa-beer ${
            css(
              classes.banner__beerIcon
            )
          }`
        }
      }),
      h.span({
        attrs: {
          class: css(
            classes.banner__title
          )
        }
      }, [
        'ToDrink'
      ])
    ])
  ])
}

function loggedIn (state) {
  return h.div([
    banner()
  ])
}

function unauthenticated (state) {
  return h.div([
    banner()
  ])
}

module.exports = function home (sources) {
  const initialState = {

  }

  const state$ = xs
    .merge(
      sources.route
        .map(route => Object.assign({ type: 'routeChange' }, route))
    )
    .fold(onMessage, initialState)
    .startWith(initialState)

  const vdom$ = xs
    .combine(
      state$,
      sources.session
    )
    .map(([state, session]) =>
      (session.user
        ? loggedIn
        : unauthenticated
      )(state, session))

  return { DOM: vdom$ }
}
