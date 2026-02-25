import { EventEmitter } from 'events'

export default class ChildProcessMock extends EventEmitter {
  constructor () {
    super()

    this.stdout = {
      on () {}
    }
    this.stderr = {
      on () {}
    }
    this.stdin = {
      end: () => {
        this.emit('exit', 0)
      }
    }
  }
}
