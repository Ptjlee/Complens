import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(__dirname, '..', 'messages')

const de = JSON.parse(readFileSync(join(messagesDir, 'de.json'), 'utf-8'))
const en = JSON.parse(readFileSync(join(messagesDir, 'en.json'), 'utf-8'))

function flatKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k
        return typeof v === 'object' && v !== null ? flatKeys(v, key) : [key]
    })
}

const deKeys = new Set(flatKeys(de))
const enKeys = new Set(flatKeys(en))

const missingInEn = [...deKeys].filter(k => !enKeys.has(k))
const missingInDe = [...enKeys].filter(k => !deKeys.has(k))

let failed = false
if (missingInEn.length) {
    console.error(`\n❌ Missing in en.json (${missingInEn.length} keys):\n  ${missingInEn.join('\n  ')}`)
    failed = true
}
if (missingInDe.length) {
    console.error(`\n❌ Missing in de.json (${missingInDe.length} keys):\n  ${missingInDe.join('\n  ')}`)
    failed = true
}

if (failed) {
    console.error('\ni18n check FAILED — locale files have diverged.')
    process.exit(1)
} else {
    console.log(`✅ i18n check passed: ${deKeys.size} keys present in all locales.`)
}
