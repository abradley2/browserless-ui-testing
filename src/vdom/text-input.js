const h = require('@cycle/dom')
const { StyleSheet, css } = require('aphrodite')
const theme = require('../theme')

const classes = StyleSheet.create({
  textInput: {
    border: `1px solid ${theme.beerBrown}`,
    borderRadius: '3px',
    height: 32,
    fontSize: 16,
    padding: '0px 4px'
  }
})

function textInput (sel, attrs) {
  return h.input({
    attrs: Object.assign({}, {
      class: sel.substr(1) + ' ' + css(
        classes.textInput
      )
    }, attrs)
  })
}

module.exports = textInput
