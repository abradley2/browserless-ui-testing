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

function layout (body) {
  return h.div([
    banner(),
    h.div({
      attrs: {
        class: css(
          classes.container
        )
      }
    }, body)
  ])
}

module.exports = layout
