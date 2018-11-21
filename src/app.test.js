const test = require('tape')
const app = require('./app')
const { run } = require('@cycle/run')
const xs = require('xstream').default

const inputEvent = value => ({ target: { value } })

const mockDOMDriver = (listener) => (vdom$) => {
  vdom$.subscribe(listener)

  return {
    select: function select (selector) {
      return {
        events: function events (eventName) {
          return xs.of(
            inputEvent('this was mocked')
          )
        }
      }
    }
  }
}

test('app test', { timeout: 1000 }, function (t) {
  t.plan(1)

  function vdomListener (e) {
    console.log('GOT VDOM EVVENT', e)
  }

  run(app, { DOM: mockDOMDriver(vdomListener) })

  setTimeout(function () {
    t.ok(app)
  }, 500)
})
