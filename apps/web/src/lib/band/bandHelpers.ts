/**
 * Pure (sync) helpers for salary band logic.
 * Kept in a separate file so they can be imported by both server and client
 * without conflicting with the 'use server' directive in getBandContext.ts.
 */

export function detectNamingScheme(grades: string[]): string | null {
    if (grades.length === 0) return null
    const sample = grades[0]
    const all    = grades.join(',')
    if (/TVöD|TVoeD/i.test(all))     return 'TVöD'
    if (/TV-L/i.test(all))           return 'TV-L'
    if (/ERA/i.test(all))            return 'ERA'
    if (/^G\d/.test(sample))         return 'G-Skala'
    if (/^L\d/.test(sample))         return 'L-Skala'
    if (/^EG\d/i.test(sample))       return 'EG-Skala'
    if (/^E\d/.test(sample))         return 'E-Skala'
    if (/^Band\s/i.test(sample))     return 'Band-Skala'
    if (/^[A-E]$/.test(sample))      return 'Buchstaben-Skala'
    if (/^AT$/i.test(sample))        return 'AT (außertariflich)'
    return 'Intern'
}

export function naturalSort(a: string, b: string): number {
    return a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' })
}
