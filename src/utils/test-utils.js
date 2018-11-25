exports.makeMockDOMDriver = (listener, events$) => (vdom$) => {
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
