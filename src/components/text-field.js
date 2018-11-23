const { StyleSheet, css } = require('aphrodite')
const { input } = require('@cycle/dom')

const classes = StyleSheet.create({
  textField: {

  }
})

function textField (sources, selector) {
  const props$ = sources.props

  const vdom$ = props$.map(
    props =>
      input(selector, {
        attrs: {
          className: css(classes.textField),
          value: props.value,
          type: 'text'
        }
      })
  )

  return { DOM: vdom$ }
}

textField.value = (sources, selector) =>
  sources.DOM.select(selector).events('input')
    .map(e => e.target.value)

module.exports = textField
