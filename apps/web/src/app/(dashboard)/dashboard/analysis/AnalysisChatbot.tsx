'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
    MessageCircle, X, Send, Loader2, Bot, User,
    Sparkles, Maximize2, Minimize2, ChevronRight,
    AlertTriangle, CheckCircle2, FileText, BarChart3,
} from 'lucide-react'

interface Message {
    id:      string
    role:    'user' | 'assistant'
    content: string
    loading?: boolean
}

// ─── Quick prompt categories ──────────────────────────────────

const QUICK_CATEGORIES = [
    {
        label: 'Ergebnisse verstehen',
        icon: BarChart3,
        prompts: [
            'Was bedeutet der bereinigte vs. unbereinigte Entgeltunterschied?',
            'Welche Abteilung hat den größten Handlungsbedarf?',
            'Wie ist unsere Quartilsverteilung zu interpretieren?',
            'Was sind die WIF-Faktoren und wie beeinflussen sie das Ergebnis?',
        ],
    },
    {
        label: 'Rechtliche Pflichten',
        icon: AlertTriangle,
        prompts: [
            'Welche Meldepflichten gelten für unser Unternehmen nach Art. 9?',
            'Was passiert, wenn der Gap über 5% liegt — was müssen wir tun?',
            'Bis wann muss der Bericht eingereicht werden?',
            'Was ist eine gemeinsame Entgeltbewertung nach Art. 9 Abs. 1c?',
        ],
    },
    {
        label: 'Begründungen & Maßnahmen',
        icon: CheckCircle2,
        prompts: [
            'Wie formuliere ich eine richtlinienkonforme Begründung nach Art. 10?',
            'Welche Begründungskategorien sind nach der Richtlinie zulässig?',
            'Wie priorisiere ich die offenen Begründungsfälle?',
            'Was sind sinnvolle Maßnahmen nach Art. 11 für einen Gap > 5%?',
        ],
    },
    {
        label: 'Bericht & Export',
        icon: FileText,
        prompts: [
            'Was muss im EU-Bericht nach Art. 9 enthalten sein?',
            'Wie exportiere ich den fertigen Bericht als PDF?',
            'Kann ich den Bericht direkt bei der Behörde einreichen?',
            'Brauche ich eine Unterschrift / Bestätigung der Mitarbeitervertretung?',
        ],
    },
]

// ─── Markdown renderer (supports lists, bold, headers) ────────

function MarkdownText({ text }: { text: string }) {
    const lines = text.split('\n')
    return (
        <>
            {lines.map((line, i) => {
                // Heading level 2-3
                if (line.startsWith('### ')) {
                    return <p key={i} className="font-bold text-sm mt-2 mb-0.5">{line.slice(4)}</p>
                }
                if (line.startsWith('## ')) {
                    return <p key={i} className="font-bold text-sm mt-3 mb-1" style={{ color: 'var(--color-pl-brand-light)' }}>{line.slice(3)}</p>
                }
                // Unordered list
                if (line.startsWith('- ') || line.startsWith('• ')) {
                    const content = line.slice(2)
                    return (
                        <div key={i} className="flex gap-1.5 my-0.5">
                            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                            <span>{renderInline(content)}</span>
                        </div>
                    )
                }
                // Numbered list
                const numMatch = line.match(/^(\d+)\.\s(.+)/)
                if (numMatch) {
                    return (
                        <div key={i} className="flex gap-1.5 my-0.5">
                            <span className="flex-shrink-0 font-bold text-xs opacity-60 mt-0.5 w-4">{numMatch[1]}.</span>
                            <span>{renderInline(numMatch[2])}</span>
                        </div>
                    )
                }
                // Blank line
                if (!line.trim()) return <div key={i} className="h-1.5" />
                // Normal paragraph
                return <p key={i} className="my-0.5">{renderInline(line)}</p>
            })}
        </>
    )
}

function renderInline(text: string): React.ReactNode {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
    })
}

// ─── Main chatbot component ───────────────────────────────────

export default function AnalysisChatbot({ analysisId }: { analysisId?: string }) {
    const [open,       setOpen]       = useState(false)
    const [isWide,     setIsWide]     = useState(false)
    const [activeTab,  setActiveTab]  = useState<'chat' | 'prompts'>('chat')
    const [messages,   setMessages]   = useState<Message[]>([
        {
            id:      'welcome',
            role:    'assistant',
            content: [
                'Guten Tag! Ich bin Ihr CompLens Assistent — ich helfe Ihnen mit Compliance-Fragen und der Bedienung von CompLens.',
                '',
                'Ich helfe Ihnen bei:',
                '',
                '- **CompLens bedienen** — Import, Analyse, Berichte, Auskunftsrecht',
                '- **Ergebnisse verstehen** — Bereinigt vs. unbereinigt, Quartile, WIF',
                '- **Rechtliche Pflichten** — Art. 9, 10, 11 der Richtlinie 2023/970',
                '- **Begründungen formulieren** — Richtlinienkonforme Texte vorschlagen',
                '',
                analysisId
                    ? 'Ich kenne Ihre aktuellen Analyseergebnisse, Begründungen und Maßnahmenpläne.'
                    : 'Öffnen Sie eine Analyse für kontextbezogene Antworten zu Ihren konkreten Daten.',
                '',
                'Wie kann ich Ihnen helfen?',
            ].join('\n'),
        },
    ])
    const [input,    setInput]    = useState('')
    const [loading,  setLoading]  = useState(false)
    const bottomRef  = useRef<HTMLDivElement>(null)
    const inputRef   = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, open])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100)
    }, [open])

    useEffect(() => {
        const checkOpen = () => {
            if (sessionStorage.getItem('openChatbot') === 'true') {
                setOpen(true)
                sessionStorage.removeItem('openChatbot')
            }
        }
        const handleEvent = () => setOpen(true)
        checkOpen()
        window.addEventListener('toggle-chatbot', handleEvent)
        return () => window.removeEventListener('toggle-chatbot', handleEvent)
    }, [])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return

        setActiveTab('chat')

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() }
        const asstId  = `${Date.now()}-asst`
        const asstMsg: Message = { id: asstId, role: 'assistant', content: '', loading: true }

        setMessages(prev => [...prev, userMsg, asstMsg])
        setInput('')
        setLoading(true)

        try {
            const apiMessages = [
                ...messages.filter(m => m.id !== 'welcome' && !m.loading),
                userMsg,
            ].map(m => ({
                role:    m.role === 'assistant' ? 'model' as const : 'user' as const,
                content: m.content,
            }))

            const res = await fetch(
                analysisId
                    ? `/api/analysis/${analysisId}/chat`
                    : '/api/chat',
                {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: apiMessages }),
                },
            )

            if (!res.ok || !res.body) {
                let errMsg = `HTTP ${res.status}`
                try {
                    const errRes = await res.json()
                    if (errRes.error) errMsg += `: ${errRes.error}`
                } catch {
                    try { errMsg += `: ${await res.text()}` } catch {}
                }
                throw new Error(errMsg)
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const data = line.slice(6)
                    if (data === '[DONE]') break
                    try {
                        const parsed = JSON.parse(data) as { text?: string; error?: string }
                        if (parsed.text) {
                            accumulated += parsed.text
                            setMessages(prev => prev.map(m =>
                                m.id === asstId ? { ...m, content: accumulated, loading: false } : m,
                            ))
                        }
                    } catch { /* skip malformed */ }
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
            setMessages(prev => prev.map(m =>
                m.id === asstId ? { ...m, content: `Fehler: ${msg}`, loading: false } : m,
            ))
        } finally {
            setLoading(false)
        }
    }, [analysisId, messages, loading])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const panelWidth = isWide ? '900px' : '480px'

    return (
        <>
            {/* ── Floating toggle ── */}
            {!open && (
                <button
                    id="chatbot-toggle"
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-pl-brand), #7c3aed)',
                        boxShadow:  '0 8px 32px rgba(99,102,241,0.45)',
                    }}
                >
                    <Sparkles size={16} />
                    CompLens Assistent
                </button>
            )}

            {/* ── Chat panel ── */}
            {open && (
                <div
                    id="chatbot-panel"
                    className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl transition-all duration-300"
                    style={{
                        width:      panelWidth,
                        background: 'var(--color-pl-surface-elevated, #16213e)',
                        borderLeft: '1px solid var(--color-pl-border)',
                        boxShadow:  '-12px 0 60px rgba(0,0,0,0.6)',
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                        style={{
                            background:   'linear-gradient(135deg, var(--color-pl-brand), #7c3aed)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">CompLens Assistent</p>
                                <p className="text-xs text-white/70">Compliance, Produkthilfe & Ihr Analyse-Kontext</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setIsWide(!isWide)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                title={isWide ? 'Verkleinern' : 'Verbreitern'}
                            >
                                {isWide ? <Minimize2 size={15} className="text-white" /> : <Maximize2 size={15} className="text-white" />}
                            </button>
                            <button
                                id="chatbot-close"
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors bg-white/10"
                                title="Schließen"
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div
                        className="flex flex-shrink-0 border-b"
                        style={{ borderColor: 'var(--color-pl-border)' }}
                    >
                        {(['chat', 'prompts'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex-1 py-2 text-xs font-semibold transition-colors"
                                style={{
                                    color: activeTab === tab ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                                    borderBottom: activeTab === tab ? '2px solid var(--color-pl-brand)' : '2px solid transparent',
                                    background: 'transparent',
                                }}
                            >
                                {tab === 'chat' ? '💬 Chat' : '⚡ Schnellfragen'}
                            </button>
                        ))}
                    </div>

                    {/* ── TAB: Chat ── */}
                    {activeTab === 'chat' && (
                        <>
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div
                                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                            style={{
                                                background: msg.role === 'user'
                                                    ? 'var(--color-pl-brand)'
                                                    : 'rgba(99,102,241,0.2)',
                                            }}
                                        >
                                            {msg.role === 'user'
                                                ? <User size={13} className="text-white" />
                                                : <Bot  size={13} style={{ color: 'var(--color-pl-brand)' }} />
                                            }
                                        </div>
                                        <div
                                            className="max-w-[84%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                                            style={{
                                                background: msg.role === 'user'
                                                    ? 'var(--color-pl-brand)'
                                                    : 'var(--theme-pl-action-hover)',
                                                color: msg.role === 'user'
                                                    ? '#fff'
                                                    : 'var(--color-pl-text-primary)',
                                                borderRadius: msg.role === 'user'
                                                    ? '18px 18px 4px 18px'
                                                    : '18px 18px 18px 4px',
                                                border: msg.role === 'assistant' ? '1px solid var(--color-pl-border)' : 'none',
                                            }}
                                        >
                                            {msg.loading ? (
                                                <span className="flex items-center gap-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    <Loader2 size={13} className="animate-spin" />
                                                    Analysiere…
                                                </span>
                                            ) : (
                                                <MarkdownText text={msg.content} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div
                                className="px-3 pb-3 pt-2 flex-shrink-0"
                                style={{ borderTop: '1px solid var(--color-pl-border)' }}
                            >
                                <div
                                    className="flex items-end gap-2 rounded-xl px-3 py-2"
                                    style={{ background: 'var(--theme-pl-action-hover)', border: '1px solid var(--color-pl-border)' }}
                                >
                                    <textarea
                                        ref={inputRef}
                                        id="chatbot-input"
                                        rows={1}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Frage stellen… (Enter zum Senden, Shift+Enter = Zeilenumbruch)"
                                        className="flex-1 bg-transparent text-sm resize-none outline-none"
                                        style={{
                                            color:      'var(--color-pl-text-primary)',
                                            maxHeight:  '120px',
                                            lineHeight: '1.5',
                                        }}
                                    />
                                    <button
                                        id="chatbot-send"
                                        onClick={() => sendMessage(input)}
                                        disabled={loading || !input.trim()}
                                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: 'var(--color-pl-brand)' }}
                                    >
                                        {loading
                                            ? <Loader2 size={14} className="text-white animate-spin" />
                                            : <Send size={14} className="text-white" />
                                        }
                                    </button>
                                </div>
                                <p className="text-center text-xs mt-1.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Betrieben mit Gemini · Nur aggregierte Daten · DSGVO-konform
                                </p>
                            </div>
                        </>
                    )}

                    {/* ── TAB: Quick Prompts ── */}
                    {activeTab === 'prompts' && (
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                            {QUICK_CATEGORIES.map(cat => (
                                <div key={cat.label}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <cat.icon size={14} style={{ color: 'var(--color-pl-brand-light)' }} />
                                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {cat.label}
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        {cat.prompts.map(q => (
                                            <button
                                                key={q}
                                                onClick={() => sendMessage(q)}
                                                className="w-full text-left text-sm px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-all hover:scale-[1.01] group"
                                                style={{
                                                    background: 'rgba(99,102,241,0.07)',
                                                    border:     '1px solid rgba(99,102,241,0.18)',
                                                    color:      'var(--color-pl-text-primary)',
                                                }}
                                            >
                                                <span>{q}</span>
                                                <ChevronRight size={14} className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-pl-brand-light)' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
