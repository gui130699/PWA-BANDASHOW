import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const roots = ['src', 'public', 'scripts']
const standaloneFiles = [
  'README.md',
  'BRANDING_DVANERA.md',
  'CHECKLIST_PRODUCAO.md',
  'TESTES_MANUAIS_PRODUCAO.md',
  'RELATORIO_FINAL_PRODUCAO.md',
  'CHECKLIST_ORTOGRAFIA_PTBR.md',
  'index.html',
]
const supportedExtensions = new Set(['.ts', '.tsx', '.md', '.html', '.webmanifest', '.json'])
const forbiddenPatterns = [
  { pattern: /Ã|Â|â€|ï»¿/, label: 'possível erro de codificação UTF-8' },
  { pattern: /\bNao foi possivel\b/i, label: 'use “Não foi possível”' },
  { pattern: /\bPagina nao encontrada\b/i, label: 'use “Página não encontrada”' },
  { pattern: /\bInforme um e-mail valido\b/i, label: 'use “Informe um e-mail válido”' },
  { pattern: /\bServicos desejados\b/i, label: 'use “Serviços desejados”' },
  { pattern: /\bEnviar para analise\b/i, label: 'use “Enviar para análise”' },
  { pattern: /\bObservacao ou referencia\b/i, label: 'use “Observação ou referência”' },
]

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? collectFiles(path) : [path]
    }),
  )
  return nested.flat()
}

const rootFiles = (await Promise.all(roots.map(collectFiles))).flat()
const files = [...rootFiles, ...standaloneFiles].filter((file) =>
  supportedExtensions.has(extname(file)) && !file.endsWith('checkPortugueseText.ts'),
)
const findings: string[] = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  content.split(/\r?\n/).forEach((line, index) => {
    forbiddenPatterns.forEach(({ pattern, label }) => {
      if (pattern.test(line)) {
        findings.push(`${relative('.', file)}:${index + 1} - ${label}`)
      }
    })
  })
}

if (findings.length > 0) {
  console.error('Foram encontrados textos que precisam de revisão:')
  console.error(findings.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Revisão textual automática concluída em ${files.length} arquivos.`)
}
