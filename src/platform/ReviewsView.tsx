import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export function ReviewsView({listingId}:{listingId:number}) {
 const [reviews,setReviews]=useState<{id:string;rating:string;comment:string;created_at:string}[]>([])
 useEffect(()=>{let active=true;void supabase.from('public_lease_reviews').select('id,rating,comment,created_at').eq('listing_id',listingId).then(({data})=>{if(active)setReviews(data||[])});return()=>{active=false}},[listingId])
 return <section className="mt-4"><h2 className="h5">Paid lease ratings</h2>{reviews.length===0?<p>No ratings from paid leases yet.</p>:reviews.map(r=><div key={r.id} className="border rounded p-3 mb-2"><strong>{r.rating}/5</strong><p className="mb-1">{r.comment}</p><small>{new Date(r.created_at).toLocaleDateString()}</small></div>)}</section>
}
