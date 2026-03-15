'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, ChevronDown, Sparkles, Maximize2, Minimize2 } from 'lucide-react'

interface Message {
    id:      string
    role:    'user' | 'assistant'
    content: string
    loading?: boolean
}

const QUICK_PROMPTS = [
    'Was bedeutet der bereinigte Entgeltunterschied?',
    'Welche Maßnahmen sind bei > 5% Lücke erforderlich?',
    'Wie wird die Art. 10 Begründung berechnet?',
    'Welche Bereiche haben den größten Handlungsbedarf?',
    'Was sind die EU-Meldepflichten für unser Unternehmen?',
]

function MarkdownText({ text }: { text: string }) {
    // Simple markdown: bold, line breaks
    const parts = text.split(/(\*\*[^*]+\*\*|\n)/g)
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>
                }
                if (part === '\n') return <br key={i} />
                return <span key={i}>{part}</span>
            })}
        </>
    )
}

export default function AnalysisChatbot({ analysisId }: { analysisId: string }) {
    const [open,     setOpen]     = useState(false)
    const [isWide,   setIsWide]   = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id:      'welcome',
            role:    'assistant',
            content: 'Guten Tag! Ich bin Ihr EU-Entgelttransparenz-Assistent. Ich kenne die vollständigen Analyseergebnisse und helfe Ihnen, die Zahlen zu verstehen und die richtigen Maßnahmen zu ergreifen.\n\nWie kann ich Ihnen helfen?',
        },
    ])
    const [input,    setInput]    = useState('')
    const [loading,  setLoading]  = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef  = useRef<HTMLTextAreaElement>(null)

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
        
        // Handle normal explicit toggle events
        const handleEvent = () => setOpen(true)
        
        checkOpen()
        window.addEventListener('toggle-chatbot', handleEvent)
        return () => window.removeEventListener('toggle-chatbot', handleEvent)
    }, [])

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() }
        const asstId  = `${Date.now()}-asst`
        const asstMsg: Message = { id: asstId, role: 'assistant', content: '', loading: true }

        setMessages(prev => [...prev, userMsg, asstMsg])
        setInput('')
        setLoading(true)

        try {
            // Send full conversation to the route (it splits off the last message internally).
            // Exclude the static welcome message (UI-only, not a real Gemini turn).
            const apiMessages = [
                ...messages.filter(m => m.id !== 'welcome' && !m.loading),
                userMsg,
            ].map(m => ({
                role:    m.role === 'assistant' ? 'model' as const : 'user' as const,
                content: m.content,
            }))

            const res = await fetch(`/api/analysis/${analysisId}/chat`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
            })


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

    return (
        <>
            {/* ── Floating toggle button ── */}
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
                    Assistent
                </button>
            )}

            {/* ── Chat panel (Sidebar) ── */}
            {open && (
                <div
                    id="chatbot-panel"
                    className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl transition-all duration-300"
                    style={{
                        width:      isWide ? '850px' : '450px',
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
                                <p className="text-sm font-semibold text-white">Entgelttransparenz-Assistent</p>
                                <p className="text-xs text-white/70">EU RL 2023/970 · Gemini</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setIsWide(!isWide)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                                title={isWide ? "Verkleinern" : "Verbreitern (besser für lange Texte)"}
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

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
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

                                {/* Bubble */}
                                <div
                                    className="max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
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

                    {/* Quick prompts — only show at start */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2 space-y-1.5 flex-shrink-0">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>Schnellfragen</p>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_PROMPTS.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105"
                                        style={{
                                            background: 'rgba(99,102,241,0.15)',
                                            border:     '1px solid rgba(99,102,241,0.3)',
                                            color:      '#ffffff',
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input area */}
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
                                placeholder="Frage stellen… (Enter zum Senden)"
                                className="flex-1 bg-transparent text-sm resize-none outline-none"
                                style={{
                                    color:       'var(--color-pl-text-primary)',
                                    maxHeight:   '100px',
                                    lineHeight:  '1.5',
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
                            Powered by Gemini · Nur aggregierte Daten · DSGVO-konform
                        </p>
                    </div>
                </div>
            )}
        </>
    )
}
