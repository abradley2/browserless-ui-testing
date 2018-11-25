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
    height: '100vh',
    marginTop: 'calc(-16px - 48px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  unauthenticated__loginLink: {
    fontSize: 24,
    textDecoration: 'none',
    padding: 16,
    borderRadius: 3,
    color: 'white',
    backgroundColor: theme.beerBrown
  }
})

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
    h.a({
      attrs: {
        href: '/beersearch',
        'data-link': true
      }
    }, 'go to beer search')
  ])
}

function unauthenticated (state, config) {
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
        href: config.oauthURL
      }
    }, 'Login via Untappd')
  ])
}

function model (state, message) {
  switch (message.type) {
    default:
      return state
  }
}

function view (sources) {
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

  return xs
    .combine(
      sources.model,
      sources.config,
      sources.token
    )
    .map(([state, config, token]) => {
      if (!config) {
        return layout(h.div(['loading']))
      }

      const body = token
        ? loggedIn
        : unauthenticated

      return layout(body(state, config))
    })
}

function intent ({ DOM, HTTP, route }) {
  return xs
    .empty()
    .fold(model, null)
}

function sinks (sources) {
  return {
    DOM: view(sources),
    HTTP: xs.empty()
  }
}

module.exports = {
  sinks,
  intent,
  model,
  view
}
