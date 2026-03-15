import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingClient from '@/components/landing/LandingClient'

export default async function RootPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Auto-login active sessions
    if (user) redirect('/dashboard')

    return <LandingClient />
}
