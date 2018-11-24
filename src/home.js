const xs = require('xstream').default
const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('./theme')

const classes = StyleSheet.create({
  container: {
    marginTop: 48,
    padding: 16
  },
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
  },

  unauthenticated: {
    display: 'flex',
    justifyContent: 'center'
  },

  unauthenticated__loginLink: {
    fontSize: 24
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
    'you are authenticated!'
  ])
}

function unauthenticated (state, session) {
  return h.div({
    attrs: {
      class: css(
        classes.unauthenticated
      )
    }
  }, [
    h.a({
      attrs: {
        class: css(
          classes.unauthenticated__loginLink
        ),
        href: session.config.oauthURL
      }
    }, 'Login via Untappd')
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

  const layout = (body) => h.div([
    banner(),
    h.div({
      attrs: {
        class: css(
          classes.container
        )
      }
    }, body)
  ])

  const vdom$ = xs
    .combine(
      state$,
      sources.session
    )
    .map(([state, session]) => {
      if (!session.config) {
        return layout(h.div([]))
      }

      const body = session.user && session.user.token
        ? loggedIn
        : unauthenticated

      return layout(body(state, session))
    })

  return { DOM: vdom$ }
}
