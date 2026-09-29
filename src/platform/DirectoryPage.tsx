import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
type Service = { id: string; title: string; category: string; description: string; contact: string; price: string }
export function DirectoryPage() {
 const [items,setItems]=useState<Service[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;void supabase.from('service_directory').select('*').order('created_at',{ascending:false}).then(({data,error:e})=>{if(active){setItems(data||[]);setError(e?'Directory setup or connection is unavailable: '+e.message:'');setLoading(false)}});return()=>{active=false}},[])
 return <section className="container-xxl py-5"><h1>Equipment and input directory</h1><p>Reviewed directory entries. Contact the supplier to discuss availability and quotes. Add-on bookings and payments are not yet connected.</p><Link className="btn btn-outline-primary mb-4" to="/workspace?tab=services">Submit your business</Link>{loading&&<p>Loading…</p>}{error&&<p role="alert">{error}</p>}{!loading&&!error&&items.length===0&&<p>No suppliers have been approved yet.</p>}<div className="row g-3">{items.map(s=><div className="col-md-4" key={s.id}><article className="card p-4 h-100"><h2 className="h5">{s.title}</h2><p>{s.category}</p><p>{s.description}</p><p>{s.price}</p><a href={'tel:'+s.contact.replace(/[^+0-9]/g,'')}>{s.contact}</a></article></div>)}</div></section>
}
