import { EventEmitter } from 'events'
import sleep from 'sleep-promise'

const defaultParams = {
  timeout: 0,
  interval: 0,
  retry: 0,
  retryInterval: 0,
  autoStart: false
}
const _next = Symbol('_next')
const _end = Symbol('_end')
const _error = Symbol('_error')
const _isRunning = Symbol('_isRunning')
const _isError = Symbol('_isError')

const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

class TimerQueue extends EventEmitter {
  constructor (options = {}) {
    super()
    this.queue = []
    this[_isRunning] = false
    this[_isError] = false

    options = Object.assign({}, defaultParams, options)

    this.timeout = options.timeout
    this.interval = options.interval
    this.retry = options.retry
    this.retryInterval = options.retryInterval
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
    if (this.queue.length <= 0) {
      this[_end]()
      return
    }
    this[_isRunning] = true
    this[_isError] = false

    const {
      fn,
      delay = 0,
      retryCount = 0
    } = this.queue.shift()

    return sleep(delay).then(() => {
      const promises = []
      const sync = fn && fn.length
      if (sync) {
        promises.push(new Promise((resolve, reject) => {
          fn.call(this, resolve, reject)
        }))
      } else {
        const result = fn.call(this)
        if (isPromise(result)) {
          promises.push(result)
        } else if (result === false) {
          promises.push(Promise.reject(new Error('return false')))
        } else {
          promises.push(Promise.resolve())
        }
      }
      if (this.timeout > 0) {
        promises.push(sleep(this.timeout))
      }
      Promise.race(promises).catch((e) => {
        if (retryCount < this.retry) {
          this.queue.unshift({
            fn,
            delay,
            retryCount: retryCount + 1
          })
          return Promise.resolve(this.retryInterval)
        } else {
          return Promise.reject(e)
        }
      }).then((interval) => {
        this[_next](interval)
      }).catch((e) => {
        this[_error](e)
      })
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
  [_next] (interval = this.interval) {
    if (this[_isRunning] && this.queue.length) {
      sleep(interval).then(() => {
        this[_isRunning] = false
        this.start()
      })
    } else if (!this[_isError]) {
      this[_end]()
    }
  }
  [_end] () {
    this[_isRunning] = false
    this[_isError] = false
    this.emit('end')
  }
  [_error] (err) {
    this[_isRunning] = false
    this[_isError] = true
    this.emit('error', err)
  }
}

module.exports = TimerQueue
