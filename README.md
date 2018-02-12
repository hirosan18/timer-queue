# timer-queue

TimerQueue is for controlling the execution timing of function

## Installation

```
npm install timer-queue
```

## Usage - API

### class TimerQueue

#### var tqueue = new TimerQueue([opts])

Constructor

- opts `Object` - may contain inital values
- opts.interval `number` - interval time (ms) for execution. `default: 0`
- opts.timeout `number` - timeout time (ms) for execution. `default: 0`
- opts.autostart `boolean` - auto start when enqueue by `tqueue.push()`. `default: false`

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
- delay `function` - delay time (ms) for execution. `defalut: 0`


## Example

```js
import TimerQueue from 'timer-queue'

const now = Date.now()
const tqueue = new TimerQueue()

tqueue.push(() => {
  console.log(`first:  ${Date.now() - now}`)
})
tqueue.push((done) => {
  setTimeout(() => {
    console.log(`second: ${Date.now() - now}`)
    done() // execute a callback
  }, 0)
})
tqueue.push(() => {
  const promise = new Promise((resolve) => {
    console.log(`third: ${Date.now() - now}`)
    resolve()
  })
  return promise // return a promise
})
tqueue.start()
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
