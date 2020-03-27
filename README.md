# timer-queue

[![npm version](https://badge.fury.io/js/timer-queue.svg)](https://badge.fury.io/js/timer-queue)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

TimerQueue is for controlling the execution timing of function

## Installation

```
npm install timer-queue
```

## Usage - API

### class TimerQueue

#### var tqueue = new TimerQueue([options])

Constructor

- options `Object` - may contain inital values
- options.interval `number` - interval time (ms) for execution. `default: 0`
- options.timeout `number` - timeout time (ms) for execution. `default: 0`
- options.retry `number` - retry count when execution function failed. `default: 0`
- options.retryInterval `number` - interval time (ms) for retry execution. `default: 0`
- options.autostart `boolean` - auto start when enqueue by `tqueue.push()`. `default: false`
- options.startImmediately `boolean` - run immediately when queue is empty and enqueuing by `tqueue.push()`. `default: false`

#### tqueue.start()

start the queue.

#### tqueue.stop()

stop the queue.

can be resumed with `tqueue.start()` and can be empty with `tqueue.clear()`.

#### tqueue.clear()

empty the queue.

#### tqueue.push(fn[, delay])

enqueue the function.

- fn `function` - execution function
- delay `number` - delay time (ms) for execution. `defalut: 0`

#### tqueue.push(fn[, options])

enqueue the function.

- fn `function` - execution function
- options `Object` - may contain options values
- options.delay `number` - delay time (ms) for execution. `defalut: 0`
- options.retry `number` - retry count when execution function failed. `default: 0`
- options.retryInterval `number` - interval time (ms) for retry execution. `default: 0`
- options.error `function` - error callback.

## Example

```js
import TimerQueue from 'timer-queue'

let count = 0
const now = Date.now()

const tqueue = new TimerQueue({
  interval: 1000,
  timeout: 10000,
  retry: 3,
  retryInterval: 200,
  autostart: false
})

tqueue.push(() => {
  const result = count++ > 1
  console.log(`first: ${Date.now() - now}ms / return ${result}`)
  return result // return Boolean or not return
})

tqueue.push(() => {
  count = 0 // reset counter
})

tqueue.push((done, error) => {
  const result = count++ > 1
  setTimeout(() => {
    console.log(`second: ${Date.now() - now}ms / ${result ? 'done()' : 'error()'}`)
    result ? done() : error() // execute a arguments callback
  }, 0)
})

tqueue.push(() => {
  count = 0 // reset counter
})

tqueue.push(() => {
  const result = count++ > 1
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`third: ${Date.now() - now}ms / ${result ? 'resolve()' : 'reject()'}`)
      result ? resolve() : reject(new Error('retry'))
    }, 0)
  })
  return promise // return a promise
})

tqueue.on('end', () => {
  console.log(`end: ${Date.now() - now}ms`)
})
tqueue.on('error', () => {
  console.log(`error: ${Date.now() - now}ms`)
})

tqueue.start()

// => first: 3ms / return false
// => first: 212ms / return false
// => first: 414ms / return true
// => second: 2421ms / error()
// => second: 2625ms / error()
// => second: 2832ms / done()
// => third: 4841ms / reject()
// => third: 5046ms / reject()
// => third: 5250ms / resolve()
// => end: 5251ms
```

```js
import TimerQueue from 'timer-queue'

const now = Date.now()

const tqueue = new TimerQueue({
  interval: 1000,
  timeout: 10000,
  retry: 3,
  retryInterval: 200,
  autostart: false
})

tqueue.push(() => {
  console.log(`first: ${Date.now() - now}ms / return false`)
  return false
})

tqueue.push(() => {
  console.log(`second: not execute`)
})

tqueue.on('end', () => {
  console.log(`end: ${Date.now() - now}ms`)
})
tqueue.on('error', () => {
  console.log(`error: ${Date.now() - now}ms`)
})

tqueue.start()


// => first: 4ms / return false
// => first: 211ms / return false
// => first: 419ms / return false
// => first: 623ms / return false
// => error: 624ms
```

## Development

```
# build
npm run build
# test
npm run test
```

## License

MIT
