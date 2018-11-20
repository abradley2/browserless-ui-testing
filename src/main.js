const { run } = require('@cycle/run')
const { makeDOMDriver } = require('@cycle/dom')
const app = require('./app')

run(app, { DOM: makeDOMDriver(document.getElementById('app')) })
