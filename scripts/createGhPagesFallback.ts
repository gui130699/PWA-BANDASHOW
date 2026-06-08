import { copyFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDirectory = resolve('dist')
const indexPath = resolve(distDirectory, 'index.html')
const fallbackPath = resolve(distDirectory, '404.html')

await stat(indexPath)
await copyFile(indexPath, fallbackPath)

console.log('Fallback SPA criado em dist/404.html.')
