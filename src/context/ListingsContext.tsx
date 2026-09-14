import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadMyListings, loadSaved, MY_LISTINGS_KEY, SAVED_KEY, seedListings } from '../lib/data'
import type { Listing } from '../lib/types'

type ListingsContextValue = {
  listings: Listing[]
  myListings: Listing[]
  saved: number[]
  toggleSaved: (id: number) => void
  publish: (listing: Listing, editingId: number | null) => void
  remove: (id: number) => void
  getListing: (id: number) => Listing | undefined
}
const ListingsContext = createContext<ListingsContextValue | null>(null)

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(() => [...seedListings, ...loadMyListings()])
  const [saved, setSaved] = useState<number[]>(() => loadSaved())

  useEffect(() => {
    try { localStorage.setItem(MY_LISTINGS_KEY, JSON.stringify(listings.filter((item) => item.ownerId === 'me'))) } catch { /* storage unavailable */ }
  }, [listings])
  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)) } catch { /* storage unavailable */ }
  }, [saved])

  const toggleSaved = (id: number) => setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const publish = (listing: Listing, editingId: number | null) => setListings((items) => editingId ? items.map((item) => item.id === editingId ? listing : item) : [listing, ...items])
  const remove = (id: number) => setListings((items) => items.filter((item) => item.id !== id))
  const myListings = useMemo(() => listings.filter((item) => item.ownerId === 'me'), [listings])
  const getListing = (id: number) => listings.find((item) => item.id === id)

  return <ListingsContext.Provider value={{ listings, myListings, saved, toggleSaved, publish, remove, getListing }}>
    {children}
  </ListingsContext.Provider>
}

export function useListings() {
  const context = useContext(ListingsContext)
  if (!context) throw new Error('useListings must be used within a ListingsProvider')
  return context
}
