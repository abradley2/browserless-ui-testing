const test = require('tape')
const app = require('./app')
const { run } = require('@cycle/run')
const xs = require('xstream').default

const inputEvent = value => ({ target: { value } })

const mockDOMDriver = (listener, events$) => (vdom$) => {
  vdom$.subscribe(listener)

  return {
    select: (selector) => {
      return {
        events: (eventName) => {
          return events$
            .filter(
              e => e.type === `${selector}->${eventName}`
            )
            .map(
              e => e.data
            )
        }
      }
    }
  }
}

test('app test', { timeout: 1000 }, function (t) {
  t.plan(1)

  const vdomListener = {
    next: function (val) {
      console.log(JSON.stringify(val, null, 2))
    }
  }

  const events = [
    {
      type: '.field->input',
      data: inputEvent('SOME INPUT EVENT')
    }
  ]
  const events$ = xs.of(...events)

  run(app, { DOM: mockDOMDriver(vdomListener, events$) })

  setTimeout(function () {
    t.ok(app)
  }, 500)
})
