import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'

export type Visit = {
  id: number
  listing_id: number
  tenant_id: string
  owner_id: string
  requested_at: string
  proposed_at: string | null
  status: 'requested' | 'confirmed' | 'declined' | 'proposed'
}

export function useVisits() {
  const { user } = useFlow()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!user) { setVisits([]); setLoading(false); return }
    const { data, error: fetchError } = await supabase
      .from('visit_requests').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else { setVisits(data as Visit[]); setError('') }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    void reload()
    const interval = window.setInterval(() => { void reload() }, 30000)
    return () => window.clearInterval(interval)
  }, [reload])

  return { visits, loading, error, reload }
}
