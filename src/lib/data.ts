import type { Draft, Listing } from './types'

export const seedListings: Listing[] = [
  { id: 1, name: 'Mbare Greenbelt Plot', area: 'Harare South, Harare', size: '2.4 hectares', price: '$180 / season', detail: 'Jun - Nov 2026', crop: 'Leafy greens', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=85', tags: ['Borehole', 'Fenced'], featured: true, rating: 4.9, description: 'A well-drained greenbelt plot with a working borehole and full perimeter fencing. Previous seasons grew rape, covo and spinach for the Mbare market.' },
  { id: 2, name: 'Chitungwiza Orchard Land', area: 'Manyame, Mashonaland East', size: '1.8 hectares', price: '$95 / month', detail: 'Flexible term', crop: 'Horticulture', image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=85', tags: ['Irrigation', 'Storage'], rating: 4.7, description: 'Established drip irrigation lines across gently sloping land, with a lockable storage shed on site for tools and harvest.' },
  { id: 3, name: 'Borrowdale Smallholding', area: 'Borrowdale, Harare', size: '0.75 hectares', price: '$75 / month', detail: '12 month lease', crop: 'Herbs & vegetables', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=85', tags: ['Shed', 'Power nearby'], rating: 4.8, description: 'A compact, easy-to-manage plot close to the city, suited to herbs and market vegetables. Grid power is available at the boundary.' },
  { id: 4, name: 'Norton River Flats', area: 'Norton, Mashonaland West', size: '4.1 hectares', price: '$260 / season', detail: 'Jun - Nov 2026', crop: 'Maize & beans', image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1000&q=85', tags: ['River access', 'Tilled'], rating: 4.6, description: 'Flat, already-tilled river-flat land with direct water access, previously used for a maize and bean rotation.' },
]

export const categories = ['All land', 'Vegetables', 'Grains', 'Orchards']
export const TAG_OPTIONS = ['Borehole', 'Fenced', 'Irrigation', 'Storage', 'Shed', 'Power nearby', 'River access', 'Tilled']
export const STEPS = ['Basics', 'Crop & features', 'Price & term', 'Photo', 'Review']
export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85'
export const MY_LISTINGS_KEY = 'landlease-my-listings'
export const SAVED_KEY = 'landlease-saved'
export const emptyDraft: Draft = { name: '', area: '', size: '', crop: '', tags: [], price: '', unit: 'season', detail: '', image: '', description: '' }

export function loadMyListings(): Listing[] {
  try { return JSON.parse(localStorage.getItem(MY_LISTINGS_KEY) ?? '[]') } catch { return [] }
}
export function loadSaved(): number[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[2]') } catch { return [2] }
}
export function listingToDraft(listing: Listing): Draft {
  const [price, unit] = listing.price.replace('$', '').split(' / ')
  return { name: listing.name, area: listing.area, size: listing.size, crop: listing.crop, tags: listing.tags, price, unit: unit === 'month' ? 'month' : 'season', detail: listing.detail, image: listing.image, description: listing.description ?? '' }
}
