import path from 'path'
import merge from 'lodash.merge'
import fs from 'fs'

const e = process.env
const root = e.USERPROFILE || e.APPDATA || e.TMP || e.TEMP || e.HOME || e.PWD || '/tmp'

class Config {
  constructor () {
    this.path = path.join(root, '.electron2appx')
  }

  get () {
    try {
      return JSON.parse(fs.readFileSync(this.path, 'utf8'))
    } catch (err) {
      return {}
    }
  }

  set (config) {
    if (e.USER === 'root') return
    const properties = merge(this.get(), config)
    try {
      fs.writeFileSync(this.path, JSON.stringify(properties, null, 2) + '\n')
    } catch (err) {}
  }

  append (property, value) {
    if (e.USER === 'root') return
    const data = this.get()
    data[property] = value
    try {
      fs.writeFileSync(this.path, JSON.stringify(data, null, 2) + '\n')
    } catch (err) {}
  }
}

export default Config
