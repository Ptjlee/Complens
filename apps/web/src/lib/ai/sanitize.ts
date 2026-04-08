/**
 * AI input sanitization utilities.
 *
 * Strips prompt-injection patterns and limits length before user text is
 * forwarded to any LLM.  Also provides output filtering to prevent system
 * prompt content from leaking back to the client.
 */

const MAX_USER_MESSAGE_LENGTH = 4000

/** Patterns commonly used in prompt injection attacks. */
const INJECTION_PATTERNS: RegExp[] = [
    // Direct instruction overrides
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /ignore\s+(all\s+)?above\s+instructions/gi,
    /disregard\s+(all\s+)?previous/gi,
    /forget\s+(all\s+)?(your\s+)?instructions/gi,
    /override\s+(system|previous)\s+(prompt|instructions)/gi,
    /do\s+not\s+follow\s+(your|the)\s+(previous|system)\s+(instructions|prompt)/gi,

    // Prompt / system impersonation
    /^system\s*:/gim,
    /^assistant\s*:/gim,
    /\[system\]/gi,
    /\[INST\]/gi,
    /<<\s*SYS\s*>>/gi,
    /<\|im_start\|>/gi,
    /<\|system\|>/gi,

    // Reveal / exfiltrate instructions
    /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions)/gi,
    /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions)/gi,
    /print\s+(your|the)\s+(system\s+)?(prompt|instructions)/gi,
    /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions)/gi,
    /output\s+(your|the)\s+(system\s+)?(prompt|instructions)/gi,
    /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions)/gi,

    // Role-play / jailbreak
    /you\s+are\s+now\s+(in\s+)?("?DAN"?|developer\s+mode|jailbreak)/gi,
    /act\s+as\s+if\s+you\s+have\s+no\s+(restrictions|rules|guidelines)/gi,
    /pretend\s+(you\s+are|to\s+be)\s+a\s+different\s+AI/gi,
    /enter\s+(developer|god|admin)\s+mode/gi,
]

/**
 * Sanitise a user message before forwarding it to an LLM.
 *
 * 1. Trims and length-limits the input.
 * 2. Strips known prompt-injection patterns.
 * 3. Removes excessive special characters that could confuse parsing.
 *
 * Returns the cleaned string.  Returns empty string for null/undefined input.
 */
export function sanitizeUserPrompt(input: string | null | undefined): string {
    if (!input) return ''

    let text = input.trim()

    // Length limit
    if (text.length > MAX_USER_MESSAGE_LENGTH) {
        text = text.slice(0, MAX_USER_MESSAGE_LENGTH)
    }

    // Strip injection patterns
    for (const pattern of INJECTION_PATTERNS) {
        text = text.replace(pattern, '[removed]')
    }

    // Remove triple backticks (often used to escape system prompt context)
    text = text.replace(/`{3,}/g, '')

    // Collapse excessive whitespace (> 3 consecutive newlines)
    text = text.replace(/\n{4,}/g, '\n\n\n')

    // Remove null bytes and other control characters (except newline, tab)
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    return text.trim()
}

/**
 * Check an AI response for potential system prompt leakage.
 *
 * `sensitiveFragments` should be distinctive phrases from the system prompt
 * that should never appear verbatim in a user-facing response (e.g. exact
 * employee IDs, internal instruction text).
 *
 * Returns the response with any leaked fragments redacted, or the original
 * response if nothing is detected.
 */
export function filterAiResponse(
    response: string,
    sensitiveFragments: string[],
): string {
    let filtered = response
    for (const fragment of sensitiveFragments) {
        if (fragment.length < 4) continue // skip trivially short fragments
        if (filtered.includes(fragment)) {
            filtered = filtered.replaceAll(fragment, '[redacted]')
        }
    }
    return filtered
}

/**
 * Detect salary/compensation figures that look like exact values from
 * system prompt data (e.g. "1234.56 EUR" or "1.234,56 EUR").
 *
 * Returns true if the response contains suspicious exact salary figures
 * that also appear in the provided set of known salary values.
 */
export function containsLeakedSalaryData(
    response: string,
    knownSalaryValues: string[],
): boolean {
    return knownSalaryValues.some(
        salary => salary.length >= 4 && response.includes(salary),
    )
}

/**
 * Anonymise employee IDs in analysis data before including in a system prompt.
 *
 * Replaces real employee_id values with sequential anonymous IDs (EMP-001,
 * EMP-002, etc.).  The mapping is ephemeral and not persisted.
 *
 * Returns the anonymised text and the mapping (in case it is needed for
 * reverse lookup within the same request).
 */
export function anonymizeEmployeeIds(
    text: string,
    realIds: string[],
): { anonymized: string; mapping: Map<string, string> } {
    const mapping = new Map<string, string>()
    let anonymized = text

    // Deduplicate and sort by length descending to avoid partial replacements
    const uniqueIds = [...new Set(realIds)].sort((a, b) => b.length - a.length)

    uniqueIds.forEach((id, index) => {
        const anonId = `EMP-${String(index + 1).padStart(3, '0')}`
        mapping.set(id, anonId)
        // Replace all occurrences of this ID in the text
        anonymized = anonymized.replaceAll(id, anonId)
    })

    return { anonymized, mapping }
}
