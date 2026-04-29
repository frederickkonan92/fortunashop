import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const APP_ROOT = join(process.cwd(), 'app')

// --- Étape 1 : Trouver toutes les pages existantes ---
function findPages(dir: string, prefix: string = ''): string[] {
  const pages: string[] = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return pages
  }

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue

    const fullPath = join(dir, entry.name)
    // Convertit le nom du dossier : [slug] → segment dynamique
    const segment = entry.name

    if (entry.isDirectory()) {
      pages.push(...findPages(fullPath, prefix + '/' + segment))
    } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
      // La route est le préfixe du dossier parent
      pages.push(prefix || '/')
    }
  }
  return pages
}

// --- Étape 2 : Trouver tous les fichiers .tsx/.ts dans app/ ---
function findSourceFiles(dir: string): string[] {
  const files: string[] = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(fullPath))
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

// --- Étape 3 : Extraire les liens internes ---
function extractInternalLinks(filePath: string): Array<{ link: string; line: number }> {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const links: Array<{ link: string; line: number }> = []

  // Patterns de liens internes
  const patterns = [
    /href=["'](\/([\w\-\/\[\]]*))["']/g,       // href="/..."
    /router\.push\(["'](\/([\w\-\/\[\]]*))["']\)/g,  // router.push("/...")
    /redirect\(["'](\/([\w\-\/\[\]]*))["']\)/g,       // redirect("/...")
  ]

  for (let i = 0; i < lines.length; i++) {
    for (const pattern of patterns) {
      // Reset le regex pour chaque ligne
      const regex = new RegExp(pattern.source, pattern.flags)
      let match
      while ((match = regex.exec(lines[i])) !== null) {
        const link = match[1]
        // Ignore les routes API et les liens avec des template literals
        if (!link.startsWith('/api/') && !link.includes('${') && !link.includes('{')) {
          links.push({ link, line: i + 1 })
        }
      }
    }
  }

  return links
}

// --- Étape 4 : Vérifier qu'un lien correspond à une page ---
function routeMatchesPage(link: string, pages: string[]): boolean {
  // Match exact
  if (pages.includes(link)) return true

  // Match avec segments dynamiques
  // Ex: /boutique/somaya → /boutique/[slug]
  const linkParts = link.split('/').filter(Boolean)

  for (const page of pages) {
    const pageParts = page.split('/').filter(Boolean)
    if (linkParts.length !== pageParts.length) continue

    let matches = true
    for (let i = 0; i < linkParts.length; i++) {
      // Un segment entre crochets [xxx] matche n'importe quoi
      if (pageParts[i].startsWith('[') && pageParts[i].endsWith(']')) continue
      if (linkParts[i] !== pageParts[i]) {
        matches = false
        break
      }
    }
    if (matches) return true
  }

  return false
}

// --- MAIN ---
console.log('🛡️  Guardian — check-routes')
console.log('Scanning', APP_ROOT, '...\n')

// Étape 1 : pages existantes
const pages = findPages(APP_ROOT)
console.log('Pages trouvées :', pages.length)
for (const p of pages.sort()) {
  console.log('  📄', p)
}

// Étape 2 : liens internes
const sourceFiles = findSourceFiles(APP_ROOT)
const allLinks: Array<{ file: string; link: string; line: number }> = []

for (const file of sourceFiles) {
  const links = extractInternalLinks(file)
  for (const l of links) {
    allLinks.push({
      file: file.replace(process.cwd() + '/', ''),
      link: l.link,
      line: l.line,
    })
  }
}

console.log('\nLiens internes trouvés :', allLinks.length)

// Étape 3 : vérification
const orphans: typeof allLinks = []

for (const entry of allLinks) {
  if (!routeMatchesPage(entry.link, pages)) {
    orphans.push(entry)
  }
}

console.log('\n---')
console.log('Pages :', pages.length)
console.log('Liens internes :', allLinks.length)
console.log('Liens orphelins :', orphans.length)

if (orphans.length > 0) {
  console.error('\n❌ ÉCHEC — liens orphelins détectés :')
  for (const o of orphans) {
    console.error('  →', o.file + ':' + o.line, '→', o.link, '(aucune page.tsx correspondante)')
  }
  process.exit(1)
} else {
  console.log('\n✅ Tous les liens internes pointent vers des pages existantes.')
  process.exit(0)
}
