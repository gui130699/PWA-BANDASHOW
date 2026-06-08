import { execFileSync } from 'node:child_process'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outputName = 'DOCUMENTACAO_COMPLETA_PROJETO.txt'
const excludedDirectories = new Set(['.git', 'dist', 'node_modules'])
const excludedFiles = new Set([
  '.env.local',
  outputName,
  'dev-server.log',
  'preview-server.log',
])
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.env',
  '.example',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.rules',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.webmanifest',
  '.yaml',
  '.yml',
])
const textNames = new Set(['.gitignore'])

type ProjectFile = {
  absolutePath: string
  relativePath: string
  size: number
  text: boolean
}

async function collectFiles(directory: string): Promise<ProjectFile[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: ProjectFile[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (excludedDirectories.has(entry.name) || excludedFiles.has(entry.name)) continue

    const absolutePath = path.join(directory, entry.name)
    const relativePath = path.relative(root, absolutePath).replaceAll('\\', '/')

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    const fileStat = await stat(absolutePath)
    files.push({
      absolutePath,
      relativePath,
      size: fileStat.size,
      text: textExtensions.has(extension) || textNames.has(entry.name),
    })
  }

  return files
}

function currentCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
  } catch {
    return 'nao identificado'
  }
}

function generatedAt() {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
}

const files = await collectFiles(root)
const textFiles = files.filter((file) => file.text)
const binaryFiles = files.filter((file) => !file.text)
const sections: string[] = [
  'DOCUMENTACAO COMPLETA DO PROJETO - PWA-BANDASHOW / GRUPO DVANERA',
  'Gerado automaticamente para leitura, manutencao, auditoria tecnica e backup.',
  `Data de geracao: ${generatedAt()} - America/Sao_Paulo`,
  `Commit base documentado: ${currentCommit()}`,
  `Pasta local: ${root}`,
  'Repositorio: https://github.com/gui130699/PWA-BANDASHOW.git',
  'Pages: https://gui130699.github.io/PWA-BANDASHOW/',
  '',
  'SEGURANCA',
  '- .env.local, .git, node_modules, dist e logs nao sao incluidos.',
  '- Segredos Firebase e credenciais administrativas nao sao copiados.',
  '- Arquivos binarios sao apenas inventariados; o conteudo textual do projeto e incluido.',
  '',
  'DOCUMENTOS DE REFERENCIA',
  '- README.md',
  '- CHECKLIST_PRODUCAO.md',
  '- TESTES_MANUAIS_PRODUCAO.md',
  '- RELATORIO_FINAL_PRODUCAO.md',
  '',
  'ARQUIVOS BINARIOS INVENTARIADOS',
  ...binaryFiles.map((file) => `- ${file.relativePath} (${file.size} bytes)`),
]

for (const file of textFiles) {
  const content = await readFile(file.absolutePath, 'utf8')
  const divider = '-'.repeat(100)
  sections.push(
    '',
    divider,
    `INICIO DO ARQUIVO: ${file.relativePath}`,
    divider,
    content.replace(/\s+$/, ''),
    '',
    divider,
    `FIM DO ARQUIVO: ${file.relativePath}`,
  )
}

sections.push('', '='.repeat(100), 'FIM DA DOCUMENTACAO COMPLETA', '')
await writeFile(path.join(root, outputName), sections.join('\n'), 'utf8')
console.log(`${outputName} atualizado com ${textFiles.length} arquivos textuais.`)
