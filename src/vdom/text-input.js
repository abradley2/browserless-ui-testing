const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('../theme')

const classes = StyleSheet.create({
  textInput: {
    border: `1px solid ${theme.beerBrown}`
  }
})

function textInput (sel, attrs) {
  return h.input(sel, {
    attrs: Object.assign({}, {
      class: css(
        classes.textInput
      )
    }, attrs)
  })
}

module.exports = textInput
