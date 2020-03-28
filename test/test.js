import TimerQueue from '../src/index.js'
import sleep from 'sleep-promise'

describe('TimerQueue', function () {
  describe('Class', function () {
    it('Checking the method', function () {
      const tqueue = new TimerQueue()

      expect(tqueue.push).toBeInstanceOf(Function)
      expect(tqueue.start).toBeInstanceOf(Function)
      expect(tqueue.stop).toBeInstanceOf(Function)
      expect(tqueue._next).not.toBeDefined()
      expect(tqueue._end).not.toBeDefined()
      expect(tqueue._isRunning).not.toBeDefined()
      expect(tqueue[Symbol('_next')]).not.toBeDefined()
      expect(tqueue[Symbol('_end')]).not.toBeDefined()
      expect(tqueue[Symbol('_isRunning')]).not.toBeDefined()
    })
    it('Checking the default value of the field', function () {
      const tqueue = new TimerQueue()

      expect(tqueue.queue).toHaveLength(0)
      expect(tqueue.isRunning).toBe(false)
      expect(tqueue.timeout).toBe(0)
      expect(tqueue.interval).toBe(0)
      expect(tqueue.retry).toBe(0)
      expect(tqueue.retryInterval).toBe(0)
      expect(tqueue.autoStart).toBe(false)
    })
  })
  describe('Constructor options', function () {
    it('When all arguments are set', function () {
      const timeout = 1000
      const interval = 1000
      const retry = 3
      const retryInterval = 300
      const autoStart = true
      const tqueue = new TimerQueue({timeout, interval, retry, retryInterval, autoStart})

      expect(tqueue.timeout).toBe(timeout)
      expect(tqueue.interval).toBe(interval)
      expect(tqueue.retry).toBe(retry)
      expect(tqueue.retryInterval).toBe(retryInterval)
      expect(tqueue.autoStart).toBe(autoStart)
    })
    it('When only the timeout value is set', function () {
      const timeout = 1000
      const tqueue = new TimerQueue({timeout})

      expect(tqueue.timeout).toBe(timeout)
      expect(tqueue.interval).toBe(0)
      expect(tqueue.autoStart).toBe(false)
    })
  })
  describe('.push()', function () {
    it('When the argument is empty', function () {
      const tqueue = new TimerQueue()

      expect(() => {
        tqueue.push()
      }).toThrow()
    })
    it('When all arguments are set', function () {
      const func = jest.fn()
      const delay = 1000
      const tqueue = new TimerQueue()
      tqueue.push(func, delay)

      expect(tqueue.queue).toHaveLength(1)
      expect(tqueue.queue[0].fn).toBe(func)
      expect(tqueue.queue[0].delay).toBe(delay)
    })
    it('When the first argument is not a function', function () {
      const func = 'test'
      const tqueue = new TimerQueue()

      expect(() => {
        tqueue.push(func)
      }).toThrow()
    })
    it('When only the first argument is set', function () {
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)

      expect(tqueue.queue).toHaveLength(1)
      expect(tqueue.queue[0].fn).toBe(func)
      expect(tqueue.queue[0].delay).toBe(0)
    })
    it('When the function of the first argument is synchronous implementation (no argument or returns not Promise)', function (done) {
      const func = jest.fn()
      const func1 = jest.fn(() => { sleep(1000).then(func) })
      const func2 = jest.fn()
      const func3 = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(func).not.toHaveBeenCalled()
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument is asynchronous implementation (with arguments)', function (done) {
      const func1 = jest.fn(done => { sleep(10).then(done) })
      const func2 = jest.fn(done => done())
      const func3 = jest.fn(done => done())
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument is asynchronous implementation (returns Promise)', function (done) {
      const func1 = jest.fn().mockReturnValue(sleep(10))
      const func2 = jest.fn().mockReturnValue(new Promise((resolve) => { resolve() }))
      const func3 = jest.fn().mockReturnValue(Promise.resolve())
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument is a mixture of synchronous and asynchronous implementation', function (done) {
      const func1 = jest.fn()
      const func2 = jest.fn(done => done())
      const func3 = jest.fn().mockReturnValue(sleep(20))
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior when the second argument of .push() is set to Number', function () {
    it('When the function of the first argument of .push() is synchronous (no argument or Promise is not returned)', function (done) {
      const func = jest.fn()
      const func1 = jest.fn(() => { sleep(10).then(func) })
      const func2 = jest.fn()
      const func3 = jest.fn()

      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        expect(func).toHaveBeenCalled()
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise)', function (done) {
      const func1 = jest.fn(done => { sleep(10).then(done) })
      const func2 = jest.fn(done => done())
      const func3 = jest.fn(done => done())

      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise)', function (done) {
      const func1 = jest.fn().mockReturnValue(sleep(10))
      const func2 = jest.fn().mockReturnValue(new Promise((resolve) => { resolve() }))
      const func3 = jest.fn().mockReturnValue(Promise.resolve())

      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is executed with a mixture of synchronous and asynchronous implementations', function (done) {
      const func1 = jest.fn()
      const func2 = jest.fn(done => done())
      const func3 = jest.fn().mockReturnValue(sleep(20))

      const tqueue = new TimerQueue()
      tqueue.push(() => { sleep(10).then(func1) }, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior when the second argument of .push() is set to delay in an object', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise)', function (done) {
      const func = jest.fn()
      const func1 = jest.fn(() => { sleep(10).then(func) })
      const func2 = jest.fn()
      const func3 = jest.fn()

      const tqueue = new TimerQueue()
      tqueue.push(func1, { delay: 20 })
      tqueue.push(func2, { delay: 20 })
      tqueue.push(func3, { delay: 20 })
      tqueue.once('end', () => {
        expect(func).toHaveBeenCalled()
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments)', function (done) {
      const func1 = jest.fn(done => { sleep(10).then(done) })
      const func2 = jest.fn(done => done())
      const func3 = jest.fn(done => done())

      const tqueue = new TimerQueue()
      tqueue.push(func1, { delay: 20 })
      tqueue.push(func2, { delay: 20 })
      tqueue.push(func3, { delay: 20 })
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise)', function (done) {
      const func1 = jest.fn().mockReturnValue(sleep(10))
      const func2 = jest.fn().mockReturnValue(new Promise((resolve) => { resolve() }))
      const func3 = jest.fn().mockReturnValue(Promise.resolve())

      const tqueue = new TimerQueue()
      tqueue.push(func1, { delay: 20 })
      tqueue.push(func2, { delay: 20 })
      tqueue.push(func3, { delay: 20 })
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is executed with mixture of synchronous and asynchronous implementations', function (done) {
      const func1 = jest.fn()
      const func2 = jest.fn(done => done())
      const func3 = jest.fn().mockReturnValue(sleep(20))

      const tqueue = new TimerQueue()
      tqueue.push(() => { sleep(10).then(func1) }, { delay: 20 })
      tqueue.push(func2, { delay: 20 })
      tqueue.push(func3, { delay: 20 })
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })

  describe('.start()', function () {
    it('When the TimerQueue is created with autoStart=false', function (done) {
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)
      sleep(10).then(() => {
        expect(func).not.toHaveBeenCalled()
        tqueue.start()
        sleep(10).then(() => {
          expect(func).toHaveBeenCalled()
          done()
        })
      })
    })
    it('When the TimerQueue is created with autoStart=true', function (done) {
      const func = jest.fn()
      const autoStart = true
      const tqueue = new TimerQueue({autoStart})
      tqueue.push(func)
      sleep(10).then(() => {
        expect(func).toHaveBeenCalled()
        tqueue.start()
        sleep(10).then(() => {
          expect(func).toHaveBeenCalledTimes(1) // 2回目は実行されない
          done()
        })
      })
    })
    it('When Queue is empty', function (done) {
      const tqueue = new TimerQueue()
      tqueue.once('end', done)
      tqueue.start()
    })
    it('When the TimerQueue has already been started', function (done) {
      const func1 = jest.fn(() => { tqueue.start() /* なにも処理されない */ })
      const func2 = jest.fn()
      const func3 = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the TimerQueue is created with autoStart=true and startImmediately=true, the first Queue will be executed immediately', function (done) {
      const timeout = 50
      const startImmediately = true
      const autoStart = true
      const tqueue = new TimerQueue({startImmediately, autoStart})
      const now = Date.now()
      const func = jest.fn().mockImplementationOnce(() => {
        expect(Date.now() - now).toBeLessThan(timeout)
      }).mockImplementationOnce(() => {
        expect(Date.now() - now).toBeGreaterThan(timeout)
      })
      tqueue.push(func, timeout)
      tqueue.push(func, timeout)
      sleep(timeout * .5).then(() => {
        expect(func).toHaveBeenCalledTimes(1)
        sleep(timeout * 1.5).then(() => {
          expect(func).toHaveBeenCalledTimes(2)
          done()
        })
      })
    });
    it('when the TimerQueue is created with autoStart=false and startImmediately=true, the first Queue will be executed immediately', function (done) {
      const timeout = 50
      const startImmediately = true
      const autoStart = false
      const tqueue = new TimerQueue({startImmediately, autoStart})
      const now = Date.now()
      const func = jest.fn().mockImplementationOnce(() => {
        expect(Date.now() - now).toBeLessThan(timeout)
      }).mockImplementationOnce(() => {
        expect(Date.now() - now).toBeGreaterThan(timeout)
      })
      tqueue.push(func, timeout)
      tqueue.push(func, timeout);
      tqueue.start();
      sleep(timeout * .5).then(() => {
        expect(func).toHaveBeenCalledTimes(1)
        sleep(timeout * 1.5).then(() => {
          expect(func).toHaveBeenCalledTimes(2)
          done()
        })
      })
    });
  })
  describe('.stop()', function () {
    it('When Queue is empty', function (done) {
      const end = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.once('end', end)
      tqueue.stop()
      sleep(10).then(() => {
        expect(end).not.toHaveBeenCalled()
        done()
      })
    })
    it('When the TimerQueue is not started', function (done) {
      const func = jest.fn()
      const end = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func)
      tqueue.once('end', end)

      tqueue.stop()
      sleep(10).then(() => {
        expect(func).not.toHaveBeenCalled()
        expect(end).not.toHaveBeenCalled()
        done()
      })
    })
    it('When the TimerQueue has already been started', function (done) {
      const func1 = jest.fn()
      const func2 = jest.fn(() => { tqueue.stop() })
      const func3 = jest.fn()
      const func4 = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.push(func4)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        expect(func4).not.toHaveBeenCalled()

        tqueue.once('end', () => {
          expect(func3).toHaveBeenCalled()
          expect(func4).toHaveBeenCalled()
          done()
        })
        tqueue.start()
      })
      tqueue.start()
    })
  })
  describe('.clear()', function () {
    it('When the TimerQueue is not started', function (done) {
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)
      tqueue.once('end', done)
      tqueue.clear()
      tqueue.start()
    })
    it('When the TimerQueue has already been started', function (done) {
      const func1 = jest.fn()
      const func2 = jest.fn(() => { tqueue.clear() })
      const func3 = jest.fn() // 実行されない
      const func4 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.push(func4)
      tqueue.once('end', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        expect(func4).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior when interval is set', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise)', function (done) {
      expect.assertions(3)
      const interval = 100
      const now = Date.now()
      const func1 = () => {
        expect(Date.now() - now).toBeGreaterThanOrEqual(0)
      }
      const func2 = () => {
        expect(Date.now() - now).toBeGreaterThanOrEqual(interval)
      }
      const func3 = () => {
        expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 2)
      }
      const tqueue = new TimerQueue({interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', done)
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments)', function (done) {
      expect.assertions(3)
      const interval = 100
      const now = Date.now()
      const func1 = done => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval)
          done()
        })
      }
      const func2 = done => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 3)
          done()
        })
      }
      const func3 = done => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 5)
          done()
        })
      }
      const tqueue = new TimerQueue({interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', done)
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise)', function (done) {
      expect.assertions(3)
      const interval = 100
      const now = Date.now()
      const func1 = () => {
        return sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval)
        })
      }
      const func2 = () => {
        return sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 3)
        })
      }
      const func3 = () => {
        return sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 5)
        })
      }
      const tqueue = new TimerQueue({interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', done)
      tqueue.start()
    })
  })
  describe('Behavior when timeout is set', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise)', function (done) {
      expect.assertions(3)
      const timeout = 100
      const now = Date.now()
      const func1 = () => {
        expect(Date.now() - now).toBeLessThanOrEqual(timeout)
      }
      const func2 = () => {
        expect(Date.now() - now).toBeLessThanOrEqual(timeout)
      }
      const func3 = () => {
        expect(Date.now() - now).toBeLessThanOrEqual(timeout)
      }
      const tqueue = new TimerQueue({timeout})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', done)
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments)', function (done) {
      const retry = 2
      const timeout = 100
      const now = Date.now()
      const func = jest.fn()
      const func1 = done => {
        func()
        sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 2) // タイムアウト関係なしに実行
          done()
        })
      }
      const func2 = jest.fn()
      const tqueue = new TimerQueue({timeout, retry})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.once('error', () => {
        expect(func).toHaveBeenCalledTimes(retry + 1)
        expect(func2).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise)', function (done) {
      const retry = 2
      const timeout = 100
      const now = Date.now()
      const func = jest.fn()
      const func1 = () => {
        func()
        return sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 2) // タイムアウト関係なしに実行
        })
      }
      const func2 = jest.fn()
      const tqueue = new TimerQueue({timeout, retry})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.once('error', () => {
        expect(func).toHaveBeenCalledTimes(retry + 1)
        expect(func2).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior in case of failure', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise) and false is returned', function (done) {
      const func1 = jest.fn().mockReturnValue(false)
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments) and error is executed', function (done) {
      const func1 = jest.fn((done, error) => error('call reject'))
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalled()
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise) and rejects', function (done) {
      const func1 = jest.fn(() => Promise.reject(new Error('reject error')))
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', (e) => {
        expect(e.message).toBe('reject error')
        expect(func1).toHaveBeenCalled()
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise and no error) and rejects', function (done) {
      const func1 = jest.fn(() => Promise.reject())
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', (e) => {
        expect(e.message).toBe('error')
        expect(func1).toHaveBeenCalled()
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the error is not handled', function (done) {
      const func1 = jest.fn(() => Promise.reject(new Error('error')))
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      setTimeout(() => {
        expect(tqueue.isFailed).toBe(true)
        expect(func1).toHaveBeenCalled()
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      }, 300)
      tqueue.start()
    })
  })
  describe('Behavior in case of failure with retry', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise) and false is returned', function (done) {
      const retry = 3
      const func1 = jest.fn().mockReturnValueOnce(false).mockReturnValue(true) // 二度目で成功
      const func2 = jest.fn().mockReturnValue(false) // 常に失敗
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue({retry})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments) and error is executed', function (done) {
      const retry = 3
      const func1 = jest.fn((done) => done()).mockImplementationOnce((done, error) => error('call reject')) // 二度目で成功
      const func2 = jest.fn((done, error) => error('call reject')) // 常に失敗
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue({retry})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise) and rejects', function (done) {
      const retry = 3
      const func1 = jest.fn(() => Promise.resolve()).mockImplementationOnce(() => Promise.reject(new Error('error'))) // 二度目で成功
      const func2 = jest.fn(() => Promise.reject(new Error('error'))) // 常に失敗
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue({retry})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the error callback of the second argument of .push() is set and rejected', function (done) {
      const retry = 3
      const error = jest.fn()
      const func1 = jest.fn(() => Promise.reject(new Error('error')))
      const func2 = jest.fn() // 実行されない
      const func3 = jest.fn() // 実行されない
      const tqueue = new TimerQueue()
      tqueue.push(func1, {retry, error: error})
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(error).toHaveBeenCalledTimes(1)
        expect(func1).toHaveBeenCalledTimes(4)
        expect(func2).not.toHaveBeenCalled()
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior in case of failure with retry/retryInterval', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise) and false is returned', function (done) {
      const retry = 3
      const retryInterval = 500
      const interval = 100
      let before = Date.now()
      const func1 = jest.fn(() => { // 二度目で成功
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return true
      }).mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        return false
      })

      const func2 = jest.fn(() => { // 常に失敗
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return false
      }).mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(interval)
        expect(now - before).toBeLessThan(retryInterval) // 新しいqueueが実行される場合はinterval分まつ
        before = now
        return false
      })

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments) and error is executed', function (done) {
      const retry = 3
      const retryInterval = 500
      const interval = 100
      let before = Date.now()
      const func1 = jest.fn((done) => { // 二度目で成功
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        done()
      }).mockImplementationOnce((done, error) => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        error('call reject')
      })

      const func2 = jest.fn((done, error) => { // 常に失敗
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        error('call reject')
      }).mockImplementationOnce((done, error) => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(interval)
        expect(now - before).toBeLessThan(retryInterval) // 新しいqueueが実行される場合はinterval分まつ
        before = now
        error('call reject')
      })

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise) and rejects', function (done) {
      const retry = 3
      const retryInterval = 500
      const interval = 100
      let before = Date.now()
      const func1 = jest.fn().mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        return Promise.reject(new Error('error'))
      }).mockImplementation(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return Promise.resolve()
      }) // 二度目で成功

      const func2 = jest.fn().mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(interval)
        expect(now - before).toBeLessThan(retryInterval) // 新しいqueueが実行される場合はinterval分まつ
        before = now
        return Promise.reject(new Error('error'))
      }).mockImplementation(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return Promise.reject(new Error('error'))
      }) // 常に失敗

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(4) // 3回リトライするので計4回実行される
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
  describe('Behavior when retry/retryInterval is overridden by the second argument of .push() and fails', function () {
    it('When the function of the first argument of .push() is synchronous implementation (no argument or returns not Promise) and false is returned', function (done) {
      const retry = 3
      const retryInterval = 500
      const overrideRetry = 1
      const overrideRetryInterval = 1000
      const interval = 100
      let before = Date.now()
      const func1 = jest.fn(() => { // 二度目で成功
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return true
      }).mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        return false
      })

      const func2 = jest.fn(() => { // 常に失敗
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(overrideRetryInterval)
        expect(now - before).toBeLessThan(overrideRetryInterval * 2) // overrideRetryIntervalに指定した時間の2倍はかからないはず
        before = now
        return false
      }).mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(interval)
        expect(now - before).toBeLessThan(retryInterval) // 新しいqueueが実行される場合はinterval分まつ
        before = now
        return false
      })

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2, {retry: overrideRetry, retryInterval: overrideRetryInterval})
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(2) // 1度しかリトライしないので計2回
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (with arguments) and error is executed', function (done) {
      const retry = 3
      const retryInterval = 500
      const overrideRetry = 1
      const overrideRetryInterval = 1000
      const interval = 100
      let before = Date.now()

      const func1 = jest.fn((done) => { // 二度目で成功
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        done()
      }).mockImplementationOnce((done, error) => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        error('call reject')
      })

      const func2 = jest.fn((done, error) => { // 常に失敗
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        error('call reject')
      }).mockImplementationOnce((done, error) => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(overrideRetryInterval)
        expect(now - before).toBeLessThan(overrideRetryInterval * 2) // overrideRetryIntervalに指定した時間の2倍はかからないはず
        before = now
        error('call reject')
      })

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2, {retry: overrideRetry, retryInterval: overrideRetryInterval})
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(2) // 1度しかリトライしないので計2回
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('When the function of the first argument of .push() is asynchronous implementation (returns Promise) and rejects', function (done) {
      const retry = 3
      const retryInterval = 500
      const overrideRetry = 1
      const overrideRetryInterval = 1000
      const interval = 100
      let before = Date.now()
      const func1 = jest.fn().mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeLessThan(interval) // 初回のintervalはなし
        before = now
        return Promise.reject(new Error('error'))
      }).mockImplementation(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(retryInterval)
        expect(now - before).toBeLessThan(retryInterval * 2) // retryIntervalに指定した時間の2倍はかからないはず
        before = now
        return Promise.resolve()
      }) // 二度目で成功

      const func2 = jest.fn().mockImplementationOnce(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(interval)
        expect(now - before).toBeLessThan(retryInterval) // 新しいqueueが実行される場合はinterval分まつ
        before = now
        return Promise.reject(new Error('error'))
      }).mockImplementation(() => {
        const now = Date.now()
        expect(now - before).toBeGreaterThanOrEqual(overrideRetryInterval)
        expect(now - before).toBeLessThan(overrideRetryInterval * 2) // overrideRetryIntervalに指定した時間の2倍はかからないはず
        before = now
        return Promise.reject(new Error('error'))
      }) // 常に失敗

      const func3 = jest.fn() // 実行されない

      const tqueue = new TimerQueue({retry, retryInterval, interval})
      tqueue.push(func1)
      tqueue.push(func2, {retry: overrideRetry, retryInterval: overrideRetryInterval})
      tqueue.push(func3)
      tqueue.once('error', () => {
        expect(func1).toHaveBeenCalledTimes(2)
        expect(func2).toHaveBeenCalledTimes(2) // 1度しかリトライしないので計2回
        expect(func3).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
  })
})
