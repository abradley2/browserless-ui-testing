const { run } = require('@cycle/run')
const { makeDOMDriver } = require('@cycle/dom')
const app = require('./app')

run(app(window.location), { DOM: makeDOMDriver(document.getElementById('app')) })
