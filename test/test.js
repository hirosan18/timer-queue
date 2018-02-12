import TimerQueue from '../src/index.js'
import sleep from 'sleep-promise'

describe('TimerQueue', function () {
  describe('クラスメンバ', function () {
    it('メソッドの確認', function () {
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
    it('フィールドのデフォルト値の確認', function () {
      const tqueue = new TimerQueue()

      expect(tqueue.queue).toHaveLength(0)
      expect(tqueue.isRunning).toBe(false)
      expect(tqueue.timeout).toBe(0)
      expect(tqueue.interval).toBe(0)
      expect(tqueue.autoStart).toBe(false)
    })
  })
  describe('コンストラクタのオプション', function () {
    it('なにも指定しない場合', function () {
      const tqueue = new TimerQueue()

      expect(tqueue.timeout).toBe(0)
      expect(tqueue.interval).toBe(0)
      expect(tqueue.autoStart).toBe(false)
    })
    it('すべて指定した場合', function () {
      const timeout = 1000
      const interval = 1000
      const autoStart = true
      const tqueue = new TimerQueue({timeout, interval, autoStart})

      expect(tqueue.timeout).toBe(timeout)
      expect(tqueue.interval).toBe(interval)
      expect(tqueue.autoStart).toBe(autoStart)
    })
    it('タイムアウト値だけ指定した場合', function () {
      const timeout = 1000
      const tqueue = new TimerQueue({timeout})

      expect(tqueue.timeout).toBe(timeout)
      expect(tqueue.interval).toBe(0)
      expect(tqueue.autoStart).toBe(false)
    })
  })
  describe('.push()', function () {
    it('引数が空の場合', function () {
      const tqueue = new TimerQueue()

      expect(() => {
        tqueue.push()
      }).toThrow()
    })
    it('引数をすべて指定した場合', function () {
      const func = jest.fn()
      const delay = 1000
      const tqueue = new TimerQueue()
      tqueue.push(func, delay)

      expect(tqueue.queue).toHaveLength(1)
      expect(tqueue.queue[0].fn).toBe(func)
      expect(tqueue.queue[0].delay).toBe(delay)
    })
    it('第一引数がfunctionではない場合', function () {
      const func = 'test'
      const tqueue = new TimerQueue()

      expect(() => {
        tqueue.push(func)
      }).toThrow()
    })
    it('第一引数のみ指定した場合', function () {
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)

      expect(tqueue.queue).toHaveLength(1)
      expect(tqueue.queue[0].fn).toBe(func)
      expect(tqueue.queue[0].delay).toBe(0)
    })
    it('第一引数のfunctionが同期実装(引数なしorPromiseを返却しない)だった場合', function (done) {
      expect.assertions(3)
      const func = jest.fn()
      let count = 0
      const func1 = () => {
        sleep(2000).then(() => {
          count++ // 実行される前に終了する
        })
        return false // falseを返却しても動作は変更されない
      }
      const func2 = () => {
        expect(count++).toBe(0)
        return func // functionを返却しても実行されない
      }
      const func3 = () => {
        expect(count++).toBe(1)
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(func).not.toHaveBeenCalled()
        done()
      })
      tqueue.start()
    })
    it('第一引数のfunctionが非同期実装(引数あり)だった場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = (done) => {
        sleep(10).then(() => {
          expect(count++).toBe(0)
          done()
        })
      }
      const func2 = (done) => {
        expect(count++).toBe(1)
        done()
      }
      const func3 = (done) => {
        expect(count++).toBe(2)
        done()
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第一引数のfunctionが非同期実装(Promiseを返却)だった場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        return sleep(10).then(() => {
          expect(count++).toBe(0)
        })
      }
      const func2 = () => {
        return new Promise((resolve) => {
          expect(count++).toBe(1)
          resolve()
        })
      }
      const func3 = () => {
        return Promise.resolve().then(() => {
          expect(count++).toBe(2)
        })
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第一引数のfunctionが同期実装と非同期実装混ぜて実行した場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        sleep(10).then(() => {
          expect(count++).toBe(1)
        })
      }
      const func2 = (done) => {
        expect(count++).toBe(0)
        done()
      }
      const func3 = () => {
        return sleep(20).then(() => {
          expect(count++).toBe(2)
        })
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })

    it('第二引数のdelayを指定、第一引数のfunctionが同期実装(引数なしorPromiseを返却しない)だった場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        sleep(10).then(() => {
          expect(count++).toBe(0)
        })
      }
      const func2 = () => {
        expect(count++).toBe(1)
      }
      const func3 = () => {
        expect(count++).toBe(2)
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第二引数のdelayを指定、第一引数のfunctionが非同期実装(引数あり)だった場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = (done) => {
        sleep(10).then(() => {
          expect(count++).toBe(0)
          done()
        })
      }
      const func2 = (done) => {
        expect(count++).toBe(1)
        done()
      }
      const func3 = (done) => {
        expect(count++).toBe(2)
        done()
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第二引数のdelayを指定、第一引数のfunctionが非同期実装(Promiseを返却)だった場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        return sleep(10).then(() => {
          expect(count++).toBe(0)
        })
      }
      const func2 = () => {
        return new Promise((resolve) => {
          expect(count++).toBe(1)
          resolve()
        })
      }
      const func3 = () => {
        return Promise.resolve().then(() => {
          expect(count++).toBe(2)
        })
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第二引数のdelayを指定、第一引数のfunctionが同期実装と非同期実装混ぜて実行した場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        sleep(10).then(() => {
          expect(count++).toBe(0)
        })
      }
      const func2 = (done) => {
        expect(count++).toBe(1)
        done()
      }
      const func3 = () => {
        return sleep(20).then(() => {
          expect(count++).toBe(2)
        })
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
  })
  describe('.start()', function () {
    it('autoStart=falseでTimerQueueを生成した場合', function (done) {
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
    it('autoStart=trueでTimerQueueを生成した場合', function (done) {
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
    it('Queueが空の場合', function (done) {
      const tqueue = new TimerQueue()
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('すでにstart済みの場合', function (done) {
      expect.assertions(3)
      let count = 0
      const func1 = () => {
        expect(count++).toBe(0)
        tqueue.start() // なにも処理されない
      }
      const func2 = () => {
        expect(count++).toBe(1)
      }
      const func3 = () => {
        expect(count++).toBe(2)
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1, 20)
      tqueue.push(func2, 20)
      tqueue.push(func3, 20)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
  })
  describe('.stop()', function () {
    it('Queueが空の場合', function (done) {
      let count = 0
      const tqueue = new TimerQueue()
      tqueue.once('end', () => {
        count++ // 実行されない
      })
      tqueue.stop()
      sleep(10).then(() => {
        expect(count++).toBe(0)
        done()
      })
    })
    it('未startの場合', function (done) {
      let count = 0
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)
      tqueue.once('end', () => {
        count++ // 実行されない
      })

      tqueue.stop()
      sleep(10).then(() => {
        expect(count++).toBe(0)
        done()
      })
    })
    it('start済みの場合', function (done) {
      let count = 0
      const func1 = () => {
        count++
      }
      const func2 = () => {
        count++
        tqueue.stop()
      }
      const func3 = () => {
        count++
      }
      const func4 = () => {
        count++
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.push(func4)
      tqueue.once('end', () => {
        expect(count++).toBe(2)

        tqueue.once('end', () => {
          expect(count++).toBe(5)
          done()
        })
        tqueue.start()
      })
      tqueue.start()
    })
  })
  describe('.clear()', function () {
    it('未startの場合', function (done) {
      const func = jest.fn()
      const tqueue = new TimerQueue()
      tqueue.push(func)
      tqueue.once('end', () => {
        done()
      })
      tqueue.clear()
      tqueue.start()
    })
    it('start済みの場合', function (done) {
      let count = 0
      const func1 = () => {
        count++
      }
      const func2 = () => {
        count++
        tqueue.clear()
      }
      const func3 = () => {
        count++ // 実行されない
      }
      const func4 = () => {
        count++ // 実行されない
      }
      const tqueue = new TimerQueue()
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.push(func4)
      tqueue.once('end', () => {
        expect(count++).toBe(2)
        done()
      })
      tqueue.start()
    })
  })
  describe('intervalを指定した場合の挙動', function () {
    it('.push()の第一引数のfunctionが同期実装(引数なしorPromiseを返却しない)だった場合', function (done) {
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
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('.push()の第一引数のfunctionが非同期実装(引数あり)だった場合', function (done) {
      expect.assertions(3)
      const interval = 100
      const now = Date.now()
      const func1 = (done) => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval)
          done()
        })
      }
      const func2 = (done) => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 3)
          done()
        })
      }
      const func3 = (done) => {
        sleep(interval).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(interval * 5)
          done()
        })
      }
      const tqueue = new TimerQueue({interval})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('第一引数のfunctionが非同期実装(Promiseを返却)だった場合', function (done) {
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
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
  })
  describe('timeoutを指定した場合の挙動', function () {
    it('.push()の第一引数のfunctionが同期実装(引数なしorPromiseを返却しない)だった場合', function (done) {
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
      tqueue.once('end', () => {
        done()
      })
      tqueue.start()
    })
    it('.push()の第一引数のfunctionが非同期実装(引数あり)だった場合', function (done) {
      expect.assertions(5)
      let count = 0
      const timeout = 100
      const now = Date.now()
      const func1 = (done) => {
        sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 2) // タイムアウト関係なしに実行
          done()
        })
      }
      const func2 = (done) => {
        expect(Date.now() - now).toBeLessThan(timeout * 2) // 前Queueがタイムアウトされて実行
        sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 3)
          done()
        })
      }
      const func3 = (done) => {
        expect(Date.now() - now).toBeLessThan(timeout * 3) // 前Queueがタイムアウトされて実行
        sleep(timeout * 2).then(() => {
          count++ // 実行されない
          done()
        })
      }
      const tqueue = new TimerQueue({timeout})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(count).toBe(0)
        done()
      })
      tqueue.start()
    })
    it('第一引数のfunctionが非同期実装(Promiseを返却)だった場合', function (done) {
      expect.assertions(5)
      let count = 0
      const timeout = 100
      const now = Date.now()
      const func1 = () => {
        return sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 2) // タイムアウト関係なしに実行
        })
      }
      const func2 = () => {
        expect(Date.now() - now).toBeLessThan(timeout * 2) // 前Queueがタイムアウトされて実行
        return sleep(timeout * 2).then(() => {
          expect(Date.now() - now).toBeGreaterThanOrEqual(timeout * 3)
        })
      }
      const func3 = () => {
        expect(Date.now() - now).toBeLessThan(timeout * 3) // 前Queueがタイムアウトされて実行
        return sleep(timeout * 2).then(() => {
          count++ // 実行されない
        })
      }
      const tqueue = new TimerQueue({timeout})
      tqueue.push(func1)
      tqueue.push(func2)
      tqueue.push(func3)
      tqueue.once('end', () => {
        expect(count).toBe(0)
        done()
      })
      tqueue.start()
    })
  })
})
