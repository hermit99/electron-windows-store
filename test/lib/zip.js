'use strict'

import path from 'path'
import { describe, it, afterEach, vi, expect } from 'vitest'

import ChildProcessMock from '../fixtures/child_process.js'

describe('Zip', () => {
  const cpMock = {
    spawn (_process, _args) {
      passedProcess = _process
      passedArgs = _args
      return new ChildProcessMock()
    }
  }

  let passedArgs
  let passedProcess

  afterEach(() => {
    vi.unmock('child_process')
    passedArgs = undefined
    passedProcess = undefined
  })

  describe('zip()', () => {
    it('should attempt to zip the current app', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })

      const programMock = {
        inputDirectory: '/fakepath/to/input',
        outputDirectory: '/fakepath/to/output',
        containerVirtualization: true
      }

      const zipModule = await import('../../lib/zip.js')
      await zipModule.default(programMock)

      const expectedInput = programMock.inputDirectory
      const expectedOutput = programMock.outputDirectory
      const expectedScript = path.resolve(import.meta.url, '..', '..', '..', 'ps1', 'zip.ps1')
      const expectedPsArgs = `& {& '${expectedScript}' -source '${expectedInput}' -destination '${expectedOutput}'}`

      expect(passedProcess).toBe('powershell.exe')
    })

    it('does not zip if using simple (non-container) conversion', async () => {
      const programMock = {}
      const zipModule = await import('../../lib/zip.js')
      await zipModule.default(programMock)

      expect(passedArgs).toBeUndefined()
      expect(passedProcess).toBeUndefined()
    })
  })
})
