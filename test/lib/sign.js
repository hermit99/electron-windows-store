import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { describe, it, beforeAll, afterEach, vi, expect } from 'vitest'

import ChildProcessMock from '../fixtures/child_process.js'
import sign from '../../lib/sign.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Sign', () => {
  const tmpDir = path.join(process.env.TMPDIR || os.tmpdir(), 'electron2appx-cert-test')
  let passedArgs = []
  let passedProcess = []

  const cpMock = {
    spawn (_process, _args) {
      passedProcess.push(_process)
      passedArgs.push(_args)
      return new ChildProcessMock()
    }
  }

  beforeAll(() => {
    fs.ensureDirSync(tmpDir)
  })

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    passedArgs = []
    passedProcess = []
  })

  describe('signappx()', () => {
    it('should attempt to sign the current app', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })
      const { default: signMod } = await import('../../lib/sign.js')

      const programMock = {
        inputDirectory: '/fakepath/to/input',
        outputDirectory: '/fakepath/to/output',
        windowsKit: '/fakepath/to/windows/kit/bin',
        packageName: 'testapp',
        devCert: 'fakepath/to/devcert.pfx'
      }

      await signMod.signAppx(programMock)
      const expectedScript = path.join(programMock.windowsKit, 'signtool.exe')
      const expectedPfxFile = programMock.devCert
      const expectedAppx = path.join(programMock.outputDirectory, `${programMock.packageName}.appx`)
      const expectedParams = ['sign', '-f', expectedPfxFile, '-fd', 'SHA256', '-v', expectedAppx]

      expect(passedProcess.length).toBe(1)
      expect(passedProcess[0]).toBe(expectedScript)
      expect(passedArgs[0]).toEqual(expectedParams)
    })

    it('should pass along the certificate password', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })
      const { default: signMod } = await import('../../lib/sign.js')

      const programMock = {
        inputDirectory: '/fakepath/to/input',
        outputDirectory: '/fakepath/to/output',
        windowsKit: '/fakepath/to/windows/kit/bin',
        packageName: 'testapp',
        devCert: 'fakepath/to/devcert.p12',
        certPass: '12345'
      }

      await signMod.signAppx(programMock)
      const expectedScript = path.join(programMock.windowsKit, 'signtool.exe')
      const expectedPfxFile = programMock.devCert
      const expectedAppx = path.join(programMock.outputDirectory, `${programMock.packageName}.appx`)
      const expectedParams = ['sign', '-f', expectedPfxFile, '-fd', 'SHA256', '-v', '-p', '12345', expectedAppx]

      expect(passedProcess.length).toBe(1)
      expect(passedProcess[0]).toBe(expectedScript)
      expect(passedArgs[0]).toEqual(expectedParams)
    })

    it('should reject if no certificate is present', async () => {
      const programMock = {}
      await expect(sign.signAppx(programMock)).rejects.toBeDefined()
    })

    it('should return without signing if cert is nil', async () => {
      const programMock = { devCert: 'Nil' }
      const result = await sign.signAppx(programMock)
      expect(result).toBe('unsigned')
    })
  })

  describe('makeCert()', () => {
    it('should not attempt to import certificate when install === false', async () => {
      vi.doMock('child_process', () => ({ default: cpMock }), { virtual: true })
      const { default: signMod } = await import('../../lib/sign.js')

      await signMod.makeCert({
        publisherName: 'CN=Test',
        certFilePath: tmpDir,
        install: false,
        program: {
          windowsKit: '/fake/kit'
        }
      }).catch(() => {})

      const hasImportCertificate = passedArgs.some((args) => {
        return args.some(arg => arg.indexOf('Import-PfxCertificate') !== -1)
      })
      expect(hasImportCertificate).toBe(false)
    })
  })

  describe('isValidPublisherName()', () => {
    const scenarios = [
      { publisherName: '' },
      { publisherName: 'CN=' },
      { publisherName: 'CN=-' },
      { publisherName: 'cn=lower, ou=case' },
      { publisherName: 'CN=first.last' },
      { publisherName: 'CN="Pointlessly quoted"' },
      { publisherName: 'CN=no,o=spaces' },
      { publisherName: 'CN=" Leading and Trailing Spaces "' },
      { publisherName: 'CN=Common Name,O=Some organization' },
      { publisherName: 'O="Quoted comma, Inc."' },
      { publisherName: 'CN=!@#$^&*()[]{}<>|\\.~\'-=,O="Symbols are Cool, LLC"' },
      { publisherName: 'OU=Sales+CN=J. Smith,O=Multi-valued' },
      { publisherName: 'CN=Duplicate+CN=Attribute' },
      { publisherName: 'OU=Trailing plus+' },
      { publisherName: 'CN=trailing comma,' },
      { publisherName: 'CN="Escaped\\ and\\ quoted\\ spaces"' },
      { publisherName: 'CN=First M Last, O="Acme, Inc."' },
      { publisherName: 'CN=Marshall T. Rose, O=Dover Beach Consulting, L=Santa Clara,ST=California, C=US' },
      { publisherName: 'CN=L. Eagle, O="Sue, Grabbit and Runn", C=GB' },
      { publisherName: 'O=No CN' },
      { publisherName: 'SERIALNUMBER=1' },
      { publisherName: 'X', expectInvalid: true },
      { publisherName: 'CN=X,UID=userId', expectInvalid: true },
      { publisherName: 'CN=\\ Escaped leading space"', expectInvalid: true },
      { publisherName: 'CN="Quotation \\" Mark"', expectInvalid: true },
      { publisherName: 'CN=X,DNQ=qualifier', expectInvalid: true },
      { publisherName: 'CN=Sue\\, Grabbit and Runn', expectInvalid: true }
    ]

    scenarios.forEach((scenario) => {
      const actualResult = sign.isValidPublisherName(scenario.publisherName)
      let nameToPrint = scenario.publisherName.replace(/\n/g, '\\n')
      if (nameToPrint.length > 60) {
        nameToPrint = nameToPrint.slice(0, 61) + '...'
      }

      it(`return ${scenario.expectInvalid ? 'false' : 'true'} for ${nameToPrint}`, () => {
        expect(actualResult).toBe(!scenario.expectInvalid)
      })
    })
  })
})
