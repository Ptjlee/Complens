'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as XLSX from 'xlsx'
import { createHash } from 'crypto'
import { PAYLENS_FIELDS, type ColumnMapping, type MappingConfidence } from './constants'

export type { ColumnMapping, MappingConfidence } from './constants'

// ============================================================
// Types
// ============================================================

export type AiMappingResult = {
    mapping: ColumnMapping
    confidence: MappingConfidence
    sampleRows: Record<string, string>[]
    detectedEncoding?: string
    error?: string
}

// ============================================================
// Action 1: Parse uploaded file → extract headers + sample rows
// (called immediately after file upload, BEFORE AI — no data sent to AI yet)
// ============================================================

export async function parseUploadedFile(formData: FormData): Promise<{
    datasetId?: string
    headers?: string[]
    sampleRows?: Record<string, string>[]
    rowCount?: number
    error?: string
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()
    if (!member) return { error: 'Keine Organisation gefunden.' }

    // ── Trial upload limit enforcement ────────────────────────────────
    // Trial orgs: max 10 datasets. Licensed: unlimited.
    const { data: org } = await admin
        .from('organisations')
        .select('plan')
        .eq('id', member.org_id)
        .single()

    const isTrial = !org?.plan || org.plan === 'trial' || org.plan === 'free'

    if (isTrial) {
        const { count: datasetCount } = await admin
            .from('datasets')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', member.org_id)

        if ((datasetCount ?? 0) >= 10) {
            return {
                error: 'Im Testzeitraum können maximal 10 Datensätze hochgeladen werden. Upgrade auf CompLens Lizenz im Einstellungsmenü für unbegrenzte Uploads.',
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────

    const file = formData.get('file') as File | null
    const datasetName = formData.get('datasetName') as string
    const reportingYear = parseInt(formData.get('reportingYear') as string)

    if (!file) return { error: 'Keine Datei ausgewählt.' }
    if (!datasetName?.trim()) return { error: 'Bitte geben Sie einen Namen für den Datensatz ein.' }
    if (isNaN(reportingYear)) return { error: 'Bitte wählen Sie ein Berichtsjahr.' }

    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|ods)$/i)) {
        return { error: 'Nur CSV, XLSX und ODS Dateien werden unterstützt.' }
    }
    if (file.size > 10 * 1024 * 1024) return { error: 'Datei zu groß. Maximum: 10 MB.' }

    // Read file bytes
    const buffer = Buffer.from(await file.arrayBuffer())

    // Compute SHA-256 hash for audit trail (GDPR — we never store the raw file permanently)
    const fileHash = createHash('sha256').update(buffer).digest('hex')

    // Parse the file to extract headers and sample rows
    let headers: string[] = []
    let allRows: Record<string, string>[] = []

    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

        if (rawRows.length === 0) return { error: 'Die Datei enthält keine Daten.' }

        headers = Object.keys(rawRows[0])
        allRows = rawRows.map(r =>
            Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')]))
        )
    } catch {
        return { error: 'Datei konnte nicht gelesen werden. Bitte prüfen Sie das Format.' }
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'csv'
    const storagePath = `${member.org_id}/${Date.now()}_${fileHash.slice(0, 8)}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('payroll-uploads')
        .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
        })
    if (uploadError) {
        console.error('[import] Storage upload error:', uploadError)
        return { error: 'Datei-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.' }
    }

    // Create dataset record in DB (status: 'mapping')
    const { data: dataset, error: dbError } = await admin
        .from('datasets')
        .insert({
            org_id: member.org_id,
            uploaded_by: user.id,
            name: datasetName.trim(),
            reporting_year: reportingYear,
            file_hash: fileHash,
            file_name: file.name,
            file_type: fileExt,
            employee_count: allRows.length,
            status: 'mapping',
        })
        .select('id')
        .single()

    if (dbError || !dataset) {
        return { error: 'Datenbankfehler beim Speichern des Datensatzes.' }
    }

    return {
        datasetId: dataset.id,
        headers,
        sampleRows: allRows.slice(0, 5),
        rowCount: allRows.length,
    }
}

// ============================================================
// Action 2: Run AI column mapping (only called after GDPR consent)
// Sends ONLY column headers + max 5 anonymised sample values to Gemini
// ============================================================

export async function runAiColumnMapping(
    datasetId: string,
    headers: string[],
    sampleRows: Record<string, string>[],
): Promise<AiMappingResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { mapping: {}, confidence: {}, sampleRows: [], error: 'Nicht angemeldet.' }

    if (!process.env.GEMINI_API_KEY) {
        return { mapping: {}, confidence: {}, sampleRows, error: 'Automatische Zuordnung nicht konfiguriert.' }
    }

    // Build the minimal prompt — headers + small sample only (never full payroll data)
    const sampleForAi = sampleRows.slice(0, 5)
    const columnSamples = headers.map(h => ({
        column: h,
        samples: sampleForAi.map(r => r[h] ?? '').filter(Boolean).slice(0, 5),
    }))

    const targetFieldsDescription = PAYLENS_FIELDS.map(f =>
        `- "${f.key}" (${f.label})${f.required ? ' [PFLICHTFELD]' : ''}`
    ).join('\n')

    const prompt = `Du bist ein Datenintegrations-Experte für Gehaltsanalysen.

Ich habe eine Gehaltsdatei mit den folgenden Spalten und Beispielwerten (anonymisiert):
${columnSamples.map(c => `  "${c.column}": ${c.samples.join(', ')}`).join('\n')}

Ordne jede Spalte einem der folgenden PayLens-Felder zu:
${targetFieldsDescription}

Regeln:
- Gib für JEDE Quellspalte ein Mapping an
- Wenn eine Spalte keinem Feld entspricht, setze null
- WICHTIG: Wenn eine Spalte Geldbeträge oder Vergütungskomponenten enthält, die du nicht eindeutig zuordnen kannst (z.B. Zulagen, Prämien, Sonderzahlungen, sonstige Pay-Komponenten), setze das Mapping auf "benefits_in_kind" (Auffangfeld für sonstige Vergütung) — NICHT auf null
- Confidence: 0.0–1.0 (wie sicher bist du?)
- gender-Werte können sein: M/F/D, männlich/weiblich/divers, male/female, 1/2, etc.

Antworte NUR mit validem JSON in diesem Format:
{
  "mapping": { "Quellspalte": "paylens_field" oder null },
  "confidence": { "Quellspalte": 0.95 }
}`

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        // Retry up to 3 times with exponential backoff on 429
        let result
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await model.generateContent(prompt)
                break
            } catch (err: unknown) {
                const isRateLimit = String(err).includes('429') || String(err).includes('Resource exhausted')
                if (isRateLimit && attempt < 2) {
                    await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
                    continue
                }
                throw err
            }
        }
        if (!result) throw new Error('No response from Gemini after retries')
        const text = result.response.text().trim()

        // Extract JSON from the response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON in response')

        const parsed = JSON.parse(jsonMatch[0])
        const mapping: ColumnMapping = parsed.mapping ?? {}
        const confidence: MappingConfidence = parsed.confidence ?? {}

        // Persist the AI mapping + consent to the dataset record
        const admin = createAdminClient()
        await admin.from('datasets').update({
            ai_mapping_used: true,
            ai_gdpr_consent: true,
            column_mapping: mapping,
            mapping_confidence: confidence,
        }).eq('id', datasetId)

        return { mapping, confidence, sampleRows }
    } catch (err) {
        console.error('[import] Gemini mapping error:', err)
        const isRateLimit = String(err).includes('429') || String(err).includes('Resource exhausted')
        const errorMsg = isRateLimit
            ? 'Zuordnungs-Limit erreicht (API-Kontingent). Bitte manuell zuordnen oder in wenigen Minuten erneut versuchen.'
            : 'Automatische Zuordnung fehlgeschlagen. Bitte ordnen Sie die Spalten manuell zu.'
        return {
            mapping: Object.fromEntries(headers.map(h => [h, null])),
            confidence: Object.fromEntries(headers.map(h => [h, 0])),
            sampleRows,
            error: errorMsg,
        }
    }
}

// ============================================================
// Action 3: Save confirmed mapping + parse file + insert employees
// ============================================================

// Gender normalisation: map common values → DB enum
function normaliseGender(raw: string): 'male' | 'female' | 'non_binary' | 'not_specified' {
    const v = raw.trim().toLowerCase()
    if (['m', 'male', 'männlich', 'man', 'herr', '1'].includes(v)) return 'male'
    if (['f', 'w', 'female', 'weiblich', 'woman', 'frau', '2'].includes(v)) return 'female'
    if (['d', 'divers', 'non_binary', 'nonbinary', 'x', '3'].includes(v)) return 'non_binary'
    return 'not_specified'
}

// Employment type normalisation
function normaliseEmploymentType(raw: string): 'full_time' | 'part_time' | 'temporary' | 'apprentice' {
    const v = raw.trim().toLowerCase()
    if (['vollzeit', 'full_time', 'full', 'vz', '1'].includes(v)) return 'full_time'
    if (['teilzeit', 'part_time', 'part', 'tz', '2'].includes(v)) return 'part_time'
    if (['befristet', 'temporary', 'temp', '3'].includes(v)) return 'temporary'
    if (['ausbildung', 'apprentice', 'azubi', '4'].includes(v)) return 'apprentice'
    return 'full_time'
}

// Parse a salary string (handles "45.000,00", "45,000.00", "45000") → number
function parseSalary(raw: string): number | null {
    if (!raw) return null
    // Remove currency symbols and whitespace
    let s = raw.replace(/[€$£¥\s]/g, '')
    // European format: 45.000,00 → 45000.00
    if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
    // US format: 45,000.00 → 45000.00
    else if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')
    // Plain with comma decimal: 45000,5 → 45000.5
    else s = s.replace(',', '.')
    const n = parseFloat(s)
    return isNaN(n) ? null : n
}

// Salary period normalisation
function normaliseSalaryPeriod(raw: string, defaultPeriod: string): 'annual' | 'monthly' | 'hourly' {
    const v = (raw || defaultPeriod).trim().toLowerCase()
    if (['monthly', 'monatlich', 'monat', 'm'].includes(v)) return 'monthly'
    if (['hourly', 'stündlich', 'stunde', 'h'].includes(v)) return 'hourly'
    return 'annual'
}

export async function confirmMappingAndProcess(
    datasetId: string,
    mapping: ColumnMapping,
    usedAi: boolean,
    standardWeeklyHours = 40,
    defaultSalaryPeriod = 'annual',
    defaultVariablePayType: 'eur' | 'pct' | 'auto' = 'auto',
): Promise<{ success?: boolean; employeeCount?: number; hoursCoverage?: number; unmappedPayColumns?: string[]; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()

    // Fetch dataset metadata + the storage path we need to re-read the file
    const { data: dataset } = await admin
        .from('datasets')
        .select('org_id, file_type, reporting_year, file_hash')
        .eq('id', datasetId)
        .single()
    if (!dataset) return { error: 'Datensatz nicht gefunden.' }

    // List files in storage to find the one matching this dataset's hash
    const { data: storageFiles } = await supabase.storage
        .from('payroll-uploads')
        .list(dataset.org_id)

    const matchedFile = storageFiles?.find(f => f.name.includes(dataset.file_hash.slice(0, 8)))
    if (!matchedFile) return { error: 'Upload-Datei nicht mehr vorhanden. Bitte erneut hochladen.' }

    const storagePath = `${dataset.org_id}/${matchedFile.name}`

    // Download the file from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
        .from('payroll-uploads')
        .download(storagePath)
    if (downloadErr || !fileData) return { error: 'Datei konnte nicht geladen werden.' }

    // Re-parse the file
    const buffer = Buffer.from(await fileData.arrayBuffer())
    let allRows: Record<string, string>[] = []
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        allRows = rawRows.map(r =>
            Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')]))
        )
    } catch {
        return { error: 'Datei konnte nicht erneut gelesen werden.' }
    }

    if (allRows.length === 0) return { error: 'Keine Datensätze in der Datei gefunden.' }

    // Build reverse mapping: palyens_field → source_column
    const reverseMap: Record<string, string> = {}
    for (const [sourceCol, plField] of Object.entries(mapping)) {
        if (plField) reverseMap[plField] = sourceCol
    }

    // Helper: get a value from a row given a PayLens field key
    const getVal = (row: Record<string, string>, fieldKey: string): string => {
        const col = reverseMap[fieldKey]
        return col ? (row[col] ?? '') : ''
    }

    // Check required fields are mapped
    const genderCol   = reverseMap['gender']
    const salaryCol   = reverseMap['salary_base']
    if (!genderCol)  return { error: 'Pflichtfeld "Geschlecht" ist nicht zugeordnet.' }
    if (!salaryCol)  return { error: 'Pflichtfeld "Grundgehalt" ist nicht zugeordnet.' }

    // NUMERIC(12,2) max = 9,999,999,999.99 — cap at 9,999,999 to be safe
    const SALARY_MAX = 9_999_999
    const clampPay = (v: number) => Math.min(SALARY_MAX, Math.max(0, v))

    // Build employee rows
    const employeeRows = allRows.map(row => {
        const salaryBase     = parseSalary(getVal(row, 'salary_base'))
        const salaryVariable = clampPay(parseSalary(getVal(row, 'salary_variable')) ?? 0)
        const overtimePay   = clampPay(parseSalary(getVal(row, 'overtime_pay'))   ?? 0)
        const benefitsInKind = clampPay(parseSalary(getVal(row, 'benefits_in_kind')) ?? 0)
        const fteRaw = parseFloat(getVal(row, 'fte_ratio')) || 1.0
        const weeklyHoursRaw   = parseSalary(getVal(row, 'weekly_hours'))
        const monthlyHoursRaw  = parseSalary(getVal(row, 'monthly_hours'))
        const hireDateRaw      = getVal(row, 'hire_date')
        const hireDate         = hireDateRaw ? new Date(hireDateRaw) : null
        const seniorityYears   = hireDate && !isNaN(hireDate.getTime())
            ? ((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
            : null

        // Resolve variable pay type per row (column value overrides wizard default)
        function normaliseVarType(raw: string): 'eur' | 'pct' | 'auto' {
            const v = raw.trim().toLowerCase()
            if (['eur', '€', 'euro', 'betrag', 'amount'].includes(v)) return 'eur'
            if (['pct', '%', 'prozent', 'percent', 'ratio'].includes(v))  return 'pct'
            return defaultVariablePayType
        }
        const rawVarType    = getVal(row, 'variable_pay_type')
        const variablePayType = rawVarType
            ? normaliseVarType(rawVarType)
            : defaultVariablePayType

        return {
            dataset_id:         datasetId,
            org_id:             dataset.org_id,
            employee_ref:       getVal(row, 'employee_ref') || null,
            first_name:         getVal(row, 'first_name') || null,
            last_name:          getVal(row, 'last_name') || null,
            gender:             normaliseGender(getVal(row, 'gender')),
            salary_base:        clampPay(salaryBase ?? 0),
            salary_variable:    salaryVariable,
            variable_pay_type:  variablePayType,
            overtime_pay:       overtimePay,
            benefits_in_kind:   benefitsInKind,
            salary_period:      normaliseSalaryPeriod(getVal(row, 'salary_period'), defaultSalaryPeriod),
            // NUMERIC(5,2) max = 999.99h/week; NUMERIC(6,2) max = 9999.99h/month
            weekly_hours:       weeklyHoursRaw  && weeklyHoursRaw  > 0 ? Math.min(999,  weeklyHoursRaw)  : null,
            monthly_hours:      monthlyHoursRaw && monthlyHoursRaw > 0 ? Math.min(9999, monthlyHoursRaw) : null,
            fte_ratio:          Math.min(1, Math.max(0.1, fteRaw)),
            job_title:          getVal(row, 'job_title') || null,
            department:         getVal(row, 'department') || null,
            job_grade:          getVal(row, 'job_grade') || null,
            employment_type:    normaliseEmploymentType(getVal(row, 'employment_type')),
            hire_date:          hireDate && !isNaN(hireDate.getTime()) ? hireDate.toISOString().split('T')[0] : null,
            seniority_years:    seniorityYears ? Math.round(seniorityYears * 100) / 100 : null,
            location:           getVal(row, 'location') || null,
        }
    }).filter(e => e.salary_base > 0) // Drop rows with no valid salary

    if (employeeRows.length === 0) {
        return { error: 'Keine gültigen Gehaltsdaten gefunden. Bitte prüfen Sie die Spaltenzuordnung für "Grundgehalt".' }
    }

    // Delete any existing employees for this dataset (re-import safety)
    await admin.from('employees').delete().eq('dataset_id', datasetId)

    // Bulk insert in batches of 500 (Supabase limit)
    const BATCH_SIZE = 500
    for (let i = 0; i < employeeRows.length; i += BATCH_SIZE) {
        const batch = employeeRows.slice(i, i + BATCH_SIZE)
        const { error: insertErr } = await admin.from('employees').insert(batch)
        if (insertErr) {
            console.error('[import] Employee insert error:', insertErr)
            return { error: `Fehler beim Speichern der Mitarbeiterdaten: ${insertErr.message}` }
        }
    }

    // Track hours data coverage
    const hoursDataCount = employeeRows.filter(e => e.weekly_hours !== null || e.monthly_hours !== null).length
    const hoursCoverage  = Math.round((hoursDataCount / employeeRows.length) * 100)

    // Update dataset: save mapping + mark ready
    await admin.from('datasets').update({
        column_mapping:       mapping,
        ai_mapping_used:      usedAi,
        employee_count:       employeeRows.length,
        standard_weekly_hours: standardWeeklyHours,
        default_salary_period: defaultSalaryPeriod,
        hours_data_present:   hoursDataCount > 0,
        status:               'ready',
    }).eq('id', datasetId)

    // Detect unmapped source columns that contain numeric data.
    // These are columns the user left as ‘— Ignorieren —’ that might have been
    // pay components. We surface them as a warning — we do NOT auto-add them.
    const firstRow = allRows[0] ?? {}
    const unmappedPayColumns = Object.entries(mapping)
        .filter(([col, plField]) => {
            if (plField !== null) return false          // already mapped
            const v = parseSalary(firstRow[col] ?? '')
            return v !== null && v > 0                  // has a positive numeric value
        })
        .map(([col]) => col)

    return { success: true, employeeCount: employeeRows.length, hoursCoverage, unmappedPayColumns }
}
