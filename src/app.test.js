const test = require('tape')
const app = require('./app')
const xs = require('xstream').default

const inputEvent = value => ({ target: { value } })

function mockDOMDriver () {
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

  const result = app({ DOM: mockDOMDriver() })

  result.DOM
    .take(4)
    .subscribe(function (e) {
      console.log('got event', e)
    })

  setTimeout(function () {
    t.ok(app)
  }, 500)
})
