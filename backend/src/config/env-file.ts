import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function parseEnvFile(content: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }
  return values
}

export function applyEnvFileValues(
  target: Record<string, string | undefined>,
  values: Record<string, string>,
) {
  for (const [key, value] of Object.entries(values)) {
    if (target[key] === undefined) {
      target[key] = value
    }
  }
}

export function loadEnvFile(path = resolve(process.cwd(), '.env')) {
  if (!existsSync(path)) return
  applyEnvFileValues(process.env, parseEnvFile(readFileSync(path, 'utf8')))
}
