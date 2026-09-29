import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useFlow } from './FlowContext'
import { supabase } from '../lib/supabase'
import { PLACEHOLDER_IMAGE } from '../lib/data'
import type { Category, Listing } from '../lib/types'

type ListingsContextValue = {
  listings: Listing[]
  myListings: Listing[]
  loading: boolean
  error: string
  saved: number[]
  toggleSaved: (id: number) => void
  publish: (listing: Listing, editingId: number | null) => Promise<void>
  remove: (id: number) => Promise<void>
  getListing: (id: number) => Listing | undefined
}
const ListingsContext = createContext<ListingsContextValue | null>(null)

type ListingRow = {
  id: number; owner_id: string; name: string; area: string; size: string
  crop: string; category: Category; tags: string[]; price: string; detail: string
  image: string; description: string; history: string; soil: string; boundary: string
  proof_declared: boolean; verification_status: 'pending' | 'approved' | 'rejected'
}

function fromRow(row: ListingRow): Listing {
  return {
    id: row.id, ownerId: row.owner_id, name: row.name, area: row.area,
    size: row.size, crop: row.crop, category: row.category, tags: row.tags,
    price: row.price, detail: row.detail, image: row.image || PLACEHOLDER_IMAGE,
    description: row.description, history: row.history, soil: row.soil,
    boundary: row.boundary, proofDeclared: row.proof_declared,
    verificationStatus: row.verification_status,
  }
}

export function ListingsProvider({ children }: { children: ReactNode }) {
  const { user } = useFlow()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<number[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('listings').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else { setError(''); setListings((data as ListingRow[]).map(fromRow)) }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load, user?.id])

  const publish = async (listing: Listing, editingId: number | null) => {
    if (!user) throw new Error('Sign in to list land.')
    const values = {
      owner_id: user.id, name: listing.name, area: listing.area, size: listing.size,
      crop: listing.crop, category: listing.category, tags: listing.tags,
      price: listing.price, detail: listing.detail, image: listing.image,
      description: listing.description || '', history: listing.history || '',
      soil: listing.soil || '', boundary: listing.boundary || '',
      proof_declared: Boolean(listing.proofDeclared),
    }
    if (editingId) {
      const { owner_id: _owner, ...changes } = values
      void _owner
      const { error: saveError } = await supabase.from('listings').update(changes).eq('id', editingId).eq('owner_id', user.id)
      if (saveError) throw saveError
    } else {
      const { error: saveError } = await supabase.from('listings').insert(values)
      if (saveError) throw saveError
    }
    await load()
  }

  const remove = async (id: number) => {
    if (!user) throw new Error('Sign in to remove a listing.')
    const { error: removeError } = await supabase.from('listings').delete().eq('id', id).eq('owner_id', user.id)
    if (removeError) throw removeError
    await load()
  }

  const toggleSaved = (id: number) => setSaved(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id])
  const myListings = useMemo(() => listings.filter(item => item.ownerId === user?.id), [listings, user?.id])
  const getListing = (id: number) => listings.find(item => item.id === id)

  return <ListingsContext.Provider value={{ listings, myListings, loading, error, saved, toggleSaved, publish, remove, getListing }}>
    {children}
  </ListingsContext.Provider>
}

export function useListings() {
  const value = useContext(ListingsContext)
  if (!value) throw new Error('ListingsProvider missing')
  return value
}
