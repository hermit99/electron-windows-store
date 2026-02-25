'use strict'

import path from 'path'
import { describe, it, afterEach, vi, expect } from 'vitest'

describe('Manifest', () => {
  afterEach(() => {
    vi.unmock('fs-extra')
  })

  describe('manifest()', () => {
    it('should attempt to copy a manifest if it has been passed', async () => {
      const programMock = {
        outputDirectory: '/fakepath/to/output',
        manifest: '/fakepath/to/manifest'
      }

      let copySource = null
      let copyDestination = null

      const fsMock = {
        copy: function (source, destination, cb) {
          copySource = source
          copyDestination = destination

          if (cb) {
            cb()
          } else {
            return Promise.resolve()
          }
        }
      }

      vi.doMock('fs-extra', () => ({ default: fsMock }), { virtual: true })

      const manifestModule = await import('../../lib/manifest.js')
      await manifestModule.default(programMock)

      const expectedSource = path.normalize(programMock.manifest)
      const expectedDestination = path.join(programMock.outputDirectory, 'pre-appx', 'AppXManifest.xml')

      expect(copySource).toBe(expectedSource)
      expect(copyDestination).toBe(expectedDestination)
    })

    it('should resolve right away if no manifest was passed', async () => {
      const programMock = {}
      const manifestModule = await import('../../lib/manifest.js')
      const result = await manifestModule.default(programMock)
      expect(result).toBeUndefined()
    })
  })
})
