'use client'

import Link from 'next/link'
import { CalendarDays, CheckCircle2, PlayCircle, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function BookingPage() {
    return (
        <div className="min-h-screen bg-[#0c0f1a]">
            {/* Header */}
            <header className="border-b border-[#1e2336] bg-[#0c0f1a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size={32} />
                        <span className="text-lg font-bold text-white tracking-tight">CompLens</span>
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-[#4ade80] bg-[#142323] px-3 py-1.5 rounded-full border border-[#1b3a31]">
                        <CheckCircle2 size={16} /> Application Approved
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Left Col: VSL / Education */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
                            Your 5% Risk Check is Ready.
                        </h1>
                        <p className="text-lg text-[#a1a1aa] leading-relaxed">
                            Based on your HR infrastructure, resolving the 2026 reporting mandate usually takes <strong className="text-white">6 to 9 months of manual labor</strong>. Watch this 3-minute briefing to see how we automate it.
                        </p>
                    </div>

                    {/* VSL Video Placeholder */}
                    <div className="aspect-video bg-[#141829] rounded-2xl border border-[#1e2336] shadow-xl overflow-hidden relative group">
                        <img 
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2000" 
                            alt="Briefing Cover" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <button className="w-16 h-16 bg-[#5b61ff] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(91,97,255,0.4)] group-hover:scale-110 transition-transform duration-300">
                                <PlayCircle size={32} className="text-white ml-1" />
                            </button>
                            <span className="text-white font-medium mt-4">Click to watch briefing</span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="bg-[#141829] p-5 rounded-2xl border border-[#1e2336]">
                            <ShieldCheck size={28} className="text-[#5b61ff] mb-3" />
                            <h3 className="font-semibold text-white mb-2">Automated Mapping</h3>
                            <p className="text-sm text-[#a1a1aa]">We seamlessly import data from SAP/Workday and align job titles automatically.</p>
                        </div>
                        <div className="bg-[#141829] p-5 rounded-2xl border border-[#1e2336]">
                            <CalendarDays size={28} className="text-[#5b61ff] mb-3" />
                            <h3 className="font-semibold text-white mb-2">Deadline Secure</h3>
                            <p className="text-sm text-[#a1a1aa]">Ensure your remediation plans are filed well before the aggressive June 2026 cliff.</p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Booking Widget */}
                <div className="bg-[#141829] rounded-3xl border border-[#1e2336] shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-[#1e2336]">
                        <h2 className="text-xl font-bold text-white mb-2">Schedule your EU Pay Transparency Audit</h2>
                        <p className="text-sm text-[#a1a1aa]">Book a 30-minute technical deep dive with our Commercial Director to see the platform live on your data schema.</p>
                    </div>
                    
                    <div className="flex-1 p-8 flex items-center justify-center bg-[#070911]">
                        {/* Placeholder for Calendly / Cal.com iframe */}
                        <div className="text-center max-w-sm">
                            <CalendarDays size={48} className="text-[#383d54] mx-auto mb-4" />
                            <h3 className="text-[#a1a1aa] font-medium mb-4">Calendar Widget Loading...</h3>
                            <p className="text-xs text-[#6e7185] mb-6">
                                Please embed your real Calendly or Cal.com URL iframe here in production.
                            </p>
                            <a 
                                href="mailto:hello@complens.de?subject=Demo Booking Request"
                                className="inline-block w-full bg-[#1e2336] hover:bg-[#2a3045] text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Contact Sales Directly
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
