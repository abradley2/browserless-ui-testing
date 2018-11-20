const test = require('tape')
const app = require('./app')
const xs = require('xstream').default
const { run } = require('@cycle/run')

const inputEvent = value => ({ target: { value } })

function mockDOMDriver (vdom$) {
  // Use vdom$ as instructions to create DOM elements
  // ...
  console.log(vdom$)
  return {
    select: function select (selector) {
      return {
        events: function events (eventName) {
          return xs.never()
        }
      }
    }
  }
}

test('app test', { timeout: 1000 }, function (t) {
  console.log('timing test')
  t.plan(1)

  run(app, { DOM: mockDOMDriver })

  t.ok(app)
})
