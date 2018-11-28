const xs = require('xstream').default
const xsConcat = require('xstream/extra/concat').default
const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('./theme')
const routes = require('./routes')
const layout = require('./layout')
const textInput = require('./vdom/text-input')

const classes = StyleSheet.create({

  loggedIn: {
    maxWidth: 768,
    margin: 'auto'
  },

  loggedIn__searchbar: {
    textAlign: 'center'
  },

  loggedIn__searchbar__content: {
    display: 'inline-block'
  },

  loggedIn__searchbar__button: {
    width: 32,
    height: 32,
    backgroundColor: theme.beerBrown,
    color: 'white',
    display: 'inline-block',
    borderRadius: '3px',
    lineHeight: '32px'
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

const beerSearchInput = '.beer-search'

function loggedIn (state) {
  return h.div({
    attrs: {
      class: css(
        classes.loggedIn
      )
    }
  }, [
    h.div({
      attrs: {
        class: css(
          classes.loggedIn__searchbar
        )
      }
    }, [
      h.div({
        attrs: {
          class: css(
            classes.loggedIn__searchbar__content
          )
        }
      }, [
        textInput(beerSearchInput, {
          value: state.beerSearchText
        }),
        h.a({
          attrs: {
            class: css(
              classes.loggedIn__searchbar__button
            ),
            href: '/beersearch',
            'data-link': true
          }
        }, [
          h.i({
            attrs: {
              class: 'fa fa-search ' + css(
                classes.searchbar__button__icon
              )
            }
          })
        ])
      ])
    ]),
    h.h1(state.beerSearchText)
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
  editBeerSearchText: Symbol('editBeerSearchText'),
  pageShown: Symbol('pageShown'),
  userProfileResponse: Symbol('userProfileResponse')
}

const initialState = {
  active: false,
  beerSearchText: 'test'
}

function intent (sources) {
  return xs
    .merge(
      sources.DOM.select(beerSearchInput).events('input')
        .map(e => {
          console.log(e.target.value)
          return {
            type: messages.editBeerSearchText,
            value: e.target.value
          }
        }),
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
  console.log(message)
  // set active or inactive on route transition
  if (message.type === messages.pageShown) {
    return Object.assign({}, initialState, { active: message.active })
  }

  // if this page isn't active don't update
  if (!state.active) return state

  switch (message.type) {
    case messages.editBeerSearchText:
      return Object.assign({}, state, {
        beerSearchText: message.value
      })
    case messages.pageShown:
      return initialState
    default:
      return state
  }
}

function view (sources) {
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
  view,
  messages
}
