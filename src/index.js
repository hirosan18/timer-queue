import { EventEmitter } from 'events'
import sleep from 'sleep-promise'

const defaultParams = {
  timeout: 0,
  interval: 0,
  retry: 0,
  retryInterval: 0,
  autoStart: false,
  startImmediately: false
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
    this.startImmediately = options.startImmediately
  }

  push (fn, params = 0) {
    if (typeof fn !== 'function') {
      throw new TypeError('first argument must be a function')
    }
    if (typeof params === 'number') {
      params = { delay: params }
    }
    const isStartingWithEmptyQueue = this.queue.length === 0
    this.queue.push(Object.assign({}, params, {
      fn
    }))
    if (this.autoStart) {
      this.start({ isStartingWithEmptyQueue })
    }
    return this
  }

  start ({ isStartingWithEmptyQueue = true } = {}) {
    if (this[_isRunning]) {
      return
    }
    if (this.queue.length <= 0) {
      this[_end]()
      return
    }
    this[_isRunning] = true
    this[_isError] = false

    const runImmediately = this.startImmediately &&
      (
        (this.autoStart && this.queue.length === 1 && isStartingWithEmptyQueue) ||
        (!this.autoStart && isStartingWithEmptyQueue)
      )

    const {
      fn,
      delay = 0,
      retry = this.retry,
      retryInterval = this.retryInterval,
      retryCount = 0,
      error = () => {}
    } = this.queue.shift()

    const delayToUse = runImmediately ? 0 : delay
    return sleep(delayToUse).then(() => {
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
        promises.push(sleep(this.timeout).then(() => {
          return Promise.reject(new Error('timeout'))
        }))
      }
      Promise.race(promises).catch((e) => {
        if (retryCount < retry) {
          this.queue.unshift({
            fn,
            delay,
            retry,
            retryInterval,
            retryCount: retryCount + 1,
            error
          })
          return Promise.resolve(retryInterval)
        } else {
          return Promise.reject(e || new Error('error'))
        }
      }).then((interval) => {
        this[_next](interval)
      }).catch((e) => {
        error.call(this, e)
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

  get isFailed () {
    return this[_isError]
  }

  [_next] (interval = this.interval) {
    if (this[_isRunning] && this.queue.length) {
      sleep(interval).then(() => {
        this[_isRunning] = false
        this.start({ isStartingWithEmptyQueue: false })
      })
    } else {
      this[_end]()
    }
  }

  [_end] () {
    this[_isRunning] = false
    this[_isError] = false
    if (this.listenerCount('end') > 0) {
      this.emit('end')
    }
  }

  [_error] (err) {
    this[_isRunning] = false
    this[_isError] = true
    if (this.listenerCount('error') > 0) {
      this.emit('error', err)
    }
  }
}

module.exports = TimerQueue
