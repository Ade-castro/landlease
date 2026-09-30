import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Profile = {
  name: string
  email: string
  phone: string
  role: 'tenant' | 'landowner'
  idSubmitted: boolean
}

export type Case = {
  id: number
  listingId: number
  tenant: string
  visitDate?: string
  visitStatus: 'none' | 'requested' | 'proposed' | 'confirmed' | 'declined'
  proposedDate?: string
  offer: string
  status: 'interest' | 'negotiating' | 'agreed' | 'signed'
  tenantSignedAt?: string
  ownerSignedAt?: string
  witnessName?: string
}

type FlowValue = {
  profile: Profile | null
  user: User | null
  loading: boolean
  signUp: (details: Profile, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  saveProfile: (details: Profile) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  cases: Case[]
  start: (listingId: number) => number
  change: (id: number, patch: Partial<Case>) => void
}

const FlowContext = createContext<FlowValue | null>(null)

function readCases(): Case[] {
  try {
    return JSON.parse(localStorage.getItem('landlease-demo-cases') || '[]') as Case[]
  } catch {
    return []
  }
}

export function FlowProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<Case[]>(readCases)

  useEffect(() => {
    let active = true

    async function refresh(nextUser: User | null) {
      if (!active) return
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,phone,role')
        .eq('id', nextUser.id)
        .single()

      if (!active) return
      if (error) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile({
        name: data.full_name,
        phone: data.phone || '',
        role: data.role,
        email: nextUser.email || '',
        idSubmitted: false
      })
      setLoading(false)
    }

    supabase.auth.getUser().then(({ data }) => refresh(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (active) refresh(session?.user || null) }, 0)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('landlease-demo-cases', JSON.stringify(cases))
  }, [cases])

  const signUp = async (details: Profile, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: details.email,
      password,
      options: {
        emailRedirectTo: window.location.origin + import.meta.env.BASE_URL + 'account',
        data: {
          full_name: details.name,
          phone: details.phone,
          role: details.role
        }
      }
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const saveProfile = async (details: Profile) => {
    if (!user) throw new Error('Please sign in first.')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: details.name, phone: details.phone })
      .eq('id', user.id)
    if (error) throw error
    setProfile({
      ...details,
      email: user.email || details.email,
      role: profile?.role || details.role
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) throw new Error('Please sign in first.')
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (verifyError) throw new Error('Current password is incorrect.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
    setUser(null)
  }

  const start = (listingId: number) => {
    const existing = cases.find(c => c.listingId === listingId && c.tenant === user?.id)
    if (existing) return existing.id
    const id = Date.now()
    setCases(items => [...items, {
      id, listingId, tenant: user?.id || '',
      visitStatus: 'none', offer: '', status: 'interest'
    }])
    return id
  }

  const change = (id: number, patch: Partial<Case>) => {
    setCases(items => items.map(item => item.id === id ? { ...item, ...patch } : item))
  }

  return <FlowContext.Provider value={{
    profile, user, loading, signUp, signIn, saveProfile, changePassword,
    logout, cases, start, change
  }}>
    {children}
  </FlowContext.Provider>
}

export function useFlow() {
  const value = useContext(FlowContext)
  if (!value) throw new Error('FlowProvider missing')
  return value
}