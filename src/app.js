const { div, label, input, hr, h1 } = require('@cycle/dom')

module.exports = function app (sources) {
  const input$ = sources.DOM.select('.field').events('input')

  const name$ = input$
    .map(ev => {
      console.log('GOT EVENT', ev)
      return ev.target.value
    })
    .startWith('')

  name$.subscribe(function (e) {
    console.log('perform side effect for this evevnt: ', e)
  })

  const vdom$ = name$.map(
    name =>
      div([
        label('Name:'),
        input('.field', { attrs: { type: 'text' } }),
        hr(),
        h1('Hello ' + name)
      ])
  )

  return { DOM: vdom$ }
}
