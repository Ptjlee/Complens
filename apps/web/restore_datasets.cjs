const fs = require('fs')
const https = require('https')

const env = fs.readFileSync('.env.local', 'utf8')
const vars = {}
env.split('\n').forEach(line => {
    const i = line.indexOf('=')
    if (i > 0 && !line.startsWith('#')) {
        vars[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
})

const SUPABASE_URL = vars['SUPABASE_URL']
const KEY = vars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
}

const headers = {
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Content-Type': 'application/json',
}

function request(method, path, body, cb) {
    const url = new URL(path, SUPABASE_URL)
    const opts = { method, headers: { ...headers } }
    if (body) {
        const b = JSON.stringify(body)
        opts.headers['Content-Length'] = Buffer.byteLength(b)
        opts.headers['Prefer'] = 'return=representation'
    }
    const req = https.request(url, opts, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => cb(res.statusCode, d))
    })
    req.on('error', e => { console.error(e); process.exit(1) })
    if (body) req.write(JSON.stringify(body))
    req.end()
}

// 1. Fetch soft-deleted datasets
request('GET', '/rest/v1/datasets?deleted_at=not.is.null&select=id,name,reporting_year,deleted_at&order=deleted_at.desc', null, (status, data) => {
    const rows = JSON.parse(data)
    if (!rows.length) { console.log('No soft-deleted datasets found.'); return }

    console.log('Found soft-deleted datasets:')
    rows.forEach(r => console.log(`  id=${r.id}  name="${r.name}"  year=${r.reporting_year}  deleted_at=${r.deleted_at}`))

    const ids = rows.map(r => r.id).join(',')

    // 2. Restore all — PATCH deleted_at = null
    request('PATCH', `/rest/v1/datasets?id=in.(${ids})`, { deleted_at: null }, (s2, d2) => {
        if (s2 >= 200 && s2 < 300) {
            console.log(`\n✅ Restored ${rows.length} dataset(s). Refresh the page.`)
        } else {
            console.error('Restore failed:', s2, d2)
        }
    })
})
