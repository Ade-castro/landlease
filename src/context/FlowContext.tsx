import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Profile = { name: string; email: string; phone: string; role: 'tenant' | 'landowner'; idSubmitted: boolean }
export type Case = { id: number; listingId: number; tenant: string; visitDate?: string; visitStatus: 'none' | 'requested' | 'proposed' | 'confirmed' | 'declined'; proposedDate?: string; offer: string; status: 'interest' | 'negotiating' | 'agreed' | 'signed'; tenantSignedAt?: string; ownerSignedAt?: string; witnessName?: string }
type FlowValue = { profile: Profile | null; saveProfile: (p: Profile) => void; logout: () => void; cases: Case[]; start: (listingId: number) => number; change: (id: number, patch: Partial<Case>) => void }
const FlowContext = createContext<FlowValue | null>(null)
function read<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback } }
export function FlowProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => read('landlease-demo-profile', null))
  const [cases, setCases] = useState<Case[]>(() => read('landlease-demo-cases', []))
  useEffect(() => { localStorage.setItem('landlease-demo-profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('landlease-demo-cases', JSON.stringify(cases)) }, [cases])
  const start = (listingId: number) => {
    const existing = cases.find((c) => c.listingId === listingId && c.tenant === profile?.email)
    if (existing) return existing.id
    const id = Date.now()
    setCases((items) => [...items, { id, listingId, tenant: profile?.email || '', visitStatus: 'none', offer: '', status: 'interest' }])
    return id
  }
  const change = (id: number, patch: Partial<Case>) => setCases((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
  return <FlowContext.Provider value={{ profile, saveProfile: setProfile, logout: () => setProfile(null), cases, start, change }}>{children}</FlowContext.Provider>
}
export function useFlow() { const flow = useContext(FlowContext); if (!flow) throw new Error('FlowProvider missing'); return flow }
