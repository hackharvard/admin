import { writable } from 'svelte/store'
import { capitalize, lowerCase } from 'lodash'

function createAlert() {
  const alert = writable({
    type: '',
    message: ''
  })
  function trigger(type, message, auto = false) {
    if (type === 'error') {
      if (auto) {
        message = `${capitalize(
          lowerCase(message.includes('/') ? message.split('/')[1] : message)
        )}.`
      }
      alert.set({
        type,
        message: message
      })
    } else {
      alert.set({
        type,
        message
      })
    }
  }
  function reset() {
    alert.set({
      type: '',
      message: ''
    })
  }
  return { subscribe: alert.subscribe, trigger, reset }
}

export const alert = createAlert()
