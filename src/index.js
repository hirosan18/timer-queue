import { EventEmitter } from 'events'
import sleep from 'sleep-promise'

const defaultParams = {
  timeout: 0,
  interval: 0,
  autoStart: false
}
const _end = Symbol('_end')
const _next = Symbol('_next')
const _isRunning = Symbol('_isRunning')

const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

class TimerQueue extends EventEmitter {
  constructor (options = {}) {
    super()
    this.queue = []
    this[_isRunning] = false

    options = Object.assign({}, defaultParams, options)

    this.timeout = options.timeout
    this.interval = options.interval
    this.autoStart = options.autoStart
  }

  push (fn, delay = 0) {
    if (typeof fn !== 'function') {
      throw new TypeError('first argument must be a function')
    }
    this.queue.push({
      fn,
      delay
    })
    if (this.autoStart) {
      this.start()
    }
    return this
  }

  start () {
    if (this[_isRunning]) {
      return
    }
    this[_isRunning] = true

    const {
      fn = () => {},
      delay = 0
    } = this.queue.shift() || {}

    return sleep(delay).then(() => {
      const promises = []
      const sync = fn && fn.length
      if (sync) {
        promises.push(new Promise((resolve) => {
          fn.call(this, resolve)
        }))
      } else {
        const promise = fn.call(this)
        promises.push(isPromise(promise) ? promise : Promise.resolve())
      }
      if (this.timeout) {
        promises.push(sleep(this.timeout))
      }
      Promise.race(promises).then(() => this[_next]())
    })
  }
  stop () {
    this[_isRunning] = false
  }
  clear () {
    this.queue.length = 0
  }
  get isRunning () {
    return this[_isRunning]
  }
  [_next] () {
    if (this[_isRunning] && this.queue.length) {
      sleep(this.interval).then(() => {
        this[_isRunning] = false
        this.start()
      })
    } else {
      this[_end]()
    }
  }
  [_end] () {
    this[_isRunning] = false
    this.emit('end')
  }
}

module.exports = TimerQueue
