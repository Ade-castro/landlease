export type Listing = { id: number; name: string; area: string; size: string; price: string; detail: string; crop: string; image: string; tags: string[]; featured?: boolean; ownerId?: 'me'; description?: string; rating?: number }
export type Draft = { name: string; area: string; size: string; crop: string; tags: string[]; price: string; unit: 'season' | 'month'; detail: string; image: string; description: string }
export type SetDraft = (updater: Draft | ((prev: Draft) => Draft)) => void
