import { writable } from 'svelte/store'
import { errorsJson } from '$lib/data'

function createAlert() {
  const alert = writable({
    type: '',
    message: ''
  })
  function trigger(type, message, auto = true) {
    if (type === 'error') {
      if (auto) {
        let str = ''
        message =
          errorsJson[message] ??
          (str = message.split('/')[1].split('-').join(' ')).charAt(0).toUpperCase() +
            str.slice(1) +
            '.'
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
