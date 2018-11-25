const xs = require('xstream').default
const xsConcat = require('xstream/extra/concat').default
const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('./theme')
const routes = require('./routes')

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

const userProfileRequest = Symbol('userProfileRequest')

const messages = {
  pageShown: Symbol('pageShown'),
  userProfileResponse: Symbol('userProfileResponse')
}

const initialState = {
  active: false
}

function intent (sources) {
  return xs
    .merge(
      sources.HTTP.select(userProfileRequest)
        .map(response => {
          return {
            type: messages.userProfileResponse,
            body: response.body
          }
        }),
      sources.route
        .map(route => {
          return {
            type: messages.pageShown,
            active: route.name === routes.homeRoute
          }
        })
    )
    .fold(model, initialState)
}

function model (state, message) {
  // set active or inactive on route transition
  if (message.type === messages.pageShown) {
    return Object.assign({}, initialState, { active: message.active })
  }

  // if this page isn't active don't update
  if (!state.active) return state

  switch (message.type) {
    case messages.pageShown:
      return initialState
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
      sources.route,
      sources.model,
      sources.config,
      sources.token
    )
    .filter(([route]) => route.name === routes.homeRoute)
    .map(([route, state, config, token]) => {
      if (!config) {
        return layout(h.div(['loading']))
      }

      const body = token
        ? loggedIn
        : unauthenticated

      return layout(body(state, config))
    })
}

function sinks (sources) {
  return {
    DOM: view(sources),
    HTTP: xsConcat(
      sources.token.map(value => ({ type: 'token', value })), // wait for token
      sources.config.map(value => ({ type: 'config', value })), // wait for config
      sources.route.filter(route => route.name === routes.homeRoute) // fire on route init
        .map(value => ({ type: 'route', value }))
    )
      .fold((acc, cur) => {
        return Object.assign({}, acc, { [cur.type]: cur.value })
      }, {})
      .filter(v => !!v.route)
      .map(({ token, config }) => {
        return {
          url: `${config.apiURL}profile`,
          method: 'GET',
          category: userProfileRequest,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      })
  }
}

module.exports = {
  sinks,
  intent,
  model,
  view
}
