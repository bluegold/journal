import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const publicDir = path.join(rootDir, 'public')
const manifestPath = path.join(rootDir, 'src/lib/asset-manifest.generated.ts')

const assets = [
  {
    source: path.join(publicDir, 'app.css'),
    outputBaseName: 'app',
    outputExtension: '.css',
    key: 'app.css',
  },
  {
    source: path.join(publicDir, 'markdown-editor.mjs'),
    outputBaseName: 'markdown-editor',
    outputExtension: '.mjs',
    key: 'markdown-editor.mjs',
  },
]

const hashContent = (content) => createHash('sha256').update(content).digest('hex').slice(0, 8)

const buildOutputName = ({ outputBaseName, outputExtension }, hash) => `${outputBaseName}.${hash}${outputExtension}`

const cleanOldOutputs = async (entries) => {
  const patterns = [
    /^app\.[a-f0-9]{8}\.css$/,
    /^markdown-editor\.[a-f0-9]{8}\.mjs$/,
  ]

  for (const entry of entries) {
    if (!patterns.some((pattern) => pattern.test(entry))) continue
    await rm(path.join(publicDir, entry), { force: true })
  }
}

const clobberGeneratedOutputs = async () => {
  const entries = await readdir(publicDir)
  await cleanOldOutputs(entries)
}

const writeManifest = async (assetEntries) => {
  const lines = [
    'export const assetManifest = {',
  ]

  for (const { key, outputName } of assetEntries) {
    lines.push(`  '${key}': '/${outputName}',`)
  }

  lines.push('} as const', '', 'export type AssetName = keyof typeof assetManifest', '')

  await writeFile(manifestPath, `${lines.join('\n')}\n`, 'utf8')
}

const main = async () => {
  await mkdir(publicDir, { recursive: true })

  const existing = await readdir(publicDir)
  await cleanOldOutputs(existing)

  const assetEntries = []

  for (const asset of assets) {
    const source = await readFile(asset.source)
    const hash = hashContent(source)
    const outputName = buildOutputName(asset, hash)
    const outputPath = path.join(publicDir, outputName)

    await writeFile(outputPath, source)
    assetEntries.push({ key: asset.key, outputName })
  }

  await writeManifest(assetEntries)
}

const isWatchMode = process.argv.includes('--watch')
const isClobberMode = process.argv.includes('--clobber')
const sourceFiles = assets.map((asset) => asset.source)

const sourceSignature = async () => {
  const parts = []

  for (const source of sourceFiles) {
    const fileStat = await stat(source)
    parts.push(`${source}:${fileStat.mtimeMs}:${fileStat.size}`)
  }

  return parts.join('|')
}

const run = async () => {
  if (isClobberMode) {
    await clobberGeneratedOutputs()
    return
  }

  if (!isWatchMode) {
    await main()
    return
  }

  let active = false
  let lastSignature = null

  const tick = async () => {
    if (active) return
    active = true

    try {
      const nextSignature = await sourceSignature()
      if (nextSignature === lastSignature) return

      await main()
      lastSignature = nextSignature
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return
      console.error(error)
    } finally {
      active = false
    }
  }

  const interval = setInterval(() => {
    void tick()
  }, 250)

  process.on('SIGINT', () => {
    clearInterval(interval)
    process.exit(0)
  })

  await tick()
}

run().catch((error) => {
  if (isWatchMode && error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    console.error('Waiting for build outputs...')
    return
  }
  console.error(error)
  process.exit(1)
})
