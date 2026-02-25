'use strict'

import path from 'path'
import { describe, it, afterEach, vi, expect } from 'vitest'

import ChildProcessMock from '../fixtures/child_process.js'

describe('Makepri', () => {
  let spawnedProcesses = []

  const cpMock = {
    spawn (_process, _args) {
      spawnedProcesses.push({
        passedProcess: _process,
        passedArgs: _args
      })
      return new ChildProcessMock()
    }
  }

  afterEach(() => {
    vi.unmock('child_process')
    spawnedProcesses = []
  })

  describe('makepri()', () => {
    it('should attempt to call makepri.exe with createconfig as parameter', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })

      const programMock = {
        deploy: true,
        inputDirectory: '/fakepath/to/input',
        outputDirectory: '/fakepath/to/output',
        windowsKit: '/fakepath/to/windows/kit/bin',
        packageName: 'testapp',
        makePri: true
      }

      const makepriModule = await import('../../lib/makepri.js')
      await makepriModule.default(programMock)

      const exptectedTarget = path.join('pre-appx', 'priconfig.xml')
      const expectedScript = path.join(programMock.windowsKit, 'makepri.exe')
      const expectedParams = ['createconfig', '/cf', exptectedTarget, '/dq', 'en-US']

      expect(spawnedProcesses[0].passedProcess).toBe(expectedScript)
      expect(spawnedProcesses[0].passedArgs).toEqual(expectedParams)
    })

    it('should attempt to call makepri.exe with new as parameter', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })

      const programMock = {
        deploy: true,
        inputDirectory: '/fakepath/to/input',
        outputDirectory: '/fakepath/to/output',
        windowsKit: '/fakepath/to/windows/kit/bin',
        packageName: 'testapp',
        makePri: true
      }

      const makepriModule = await import('../../lib/makepri.js')
      await makepriModule.default(programMock)

      const expectedProject = 'pre-appx'
      const exptectedTarget = path.join('pre-appx', 'priconfig.xml')
      const expectedOutput = path.join('pre-appx', 'resources.pri')
      const expectedScript = path.join(programMock.windowsKit, 'makepri.exe')
      const expectedParams = ['new', '/pr', expectedProject, '/cf', exptectedTarget, '/of', expectedOutput]

      expect(spawnedProcesses[1].passedProcess).toBe(expectedScript)
      expect(spawnedProcesses[1].passedArgs).toEqual(expectedParams)
    })

    it('should reject right away if no Windows Kit is available', async () => {
      const programMock = {}
      const makepriModule = await import('../../lib/makepri.js')
      await expect(makepriModule.default(programMock)).rejects.toBeDefined()
    })
  })
})
