import assert from 'node:assert/strict'
import { applyEnvFileValues, parseEnvFile } from './env-file'

function testParseEnvFile() {
  assert.deepEqual(
    parseEnvFile(`
# comment
AI_GATEWAY_API_KEY=secret-key
AI_GATEWAY_DEFAULT_MODEL="company-model"
EMPTY=
INVALID_LINE
`),
    {
      AI_GATEWAY_API_KEY: 'secret-key',
      AI_GATEWAY_DEFAULT_MODEL: 'company-model',
      EMPTY: '',
    },
  )
}

function testApplyEnvFileDoesNotOverrideExistingValues() {
  const target: Record<string, string | undefined> = {
    AI_GATEWAY_API_KEY: 'from-shell',
  }
  applyEnvFileValues(target, {
    AI_GATEWAY_API_KEY: 'from-file',
    AI_GATEWAY_DEFAULT_MODEL: 'from-file-model',
  })
  assert.deepEqual(target, {
    AI_GATEWAY_API_KEY: 'from-shell',
    AI_GATEWAY_DEFAULT_MODEL: 'from-file-model',
  })
}

testParseEnvFile()
testApplyEnvFileDoesNotOverrideExistingValues()

console.log('env-file tests: OK')
