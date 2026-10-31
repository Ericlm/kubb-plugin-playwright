// Checks what the Kubb registry reads from the published tarball. Run it after `pnpm build`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const SCHEMA_URL = 'https://kubb.dev/schemas/kubb-extension.json'
const ALLOWED_FILES = [/^dist\//, /^docs\/.+\.md$/, /^kubb-extension\.json$/, /^package\.json$/, /^README\.md$/, /^LICENSE$/, /^CHANGELOG\.md$/]

const problems = []
const manifest = JSON.parse(readFileSync('kubb-extension.json', 'utf8'))
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const schema = await fetch(SCHEMA_URL).then((response) => {
  if (!response.ok) throw new Error(`Cannot download ${SCHEMA_URL}: ${response.status}`)
  return response.json()
})
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
if (!ajv.validate(schema, manifest)) problems.push(`kubb-extension.json does not match the schema: ${ajv.errorsText()}`)

const keys = manifest.options?.map((option) => option.key) ?? []
if (new Set(keys).size !== keys.length) problems.push('kubb-extension.json has duplicate option keys')
for (const option of manifest.options ?? []) {
  if (option.type !== 'select' || !('default' in option)) continue
  if (!option.choices.some((choice) => JSON.stringify(choice.value) === JSON.stringify(option.default))) {
    problems.push(`option "${option.key}" has a default that is not one of its choices`)
  }
}

const entry = await import(new URL('../dist/index.js', import.meta.url).href)
if (typeof entry[manifest.export] !== 'function') problems.push(`dist/index.js does not export the factory "${manifest.export}"`)
if (entry.pluginPlaywrightName !== manifest.name) problems.push(`manifest name "${manifest.name}" differs from meta.name "${entry.pluginPlaywrightName}"`)
if (!pkg.peerDependencies?.kubb && !pkg.peerDependencies?.['@kubb/core']) problems.push('package.json must list kubb or @kubb/core as a peer dependency')

const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }))
const files = pack.files.map((file) => file.path)
for (const file of files) {
  if (!ALLOWED_FILES.some((pattern) => pattern.test(file))) problems.push(`unexpected file in the tarball: ${file}`)
}
for (const required of ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'kubb-extension.json', 'docs/overview.md']) {
  if (!files.includes(required)) problems.push(`missing from the tarball: ${required}`)
}

if (problems.length) {
  console.error(problems.map((problem) => `✗ ${problem}`).join('\n'))
  process.exit(1)
}
console.log(`✓ ${pack.name}@${pack.version}: manifest valid, ${files.length} files in the tarball`)
