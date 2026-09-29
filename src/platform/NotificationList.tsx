import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'
export function NotificationList() {
 const { user } = useFlow()
 const [items,setItems] = useState<{id:string;message:string;link:string;read_at:string|null}[]>([])
 const [error,setError] = useState('')
 useEffect(() => {
  let active=true
  if (!user) return () => {active=false}
  void supabase.from('landlease_notifications').select('id,message,link,read_at').order('created_at',{ascending:false}).limit(5).then(({data,error:e})=> {if(active){if(e)setError('Notifications become available after the platform SQL setup.');else {setItems(data||[]);setError('')}}})
  return () => {active=false}
 },[user?.id])
 if(!user)return <p className="small">Sign in to see account notifications.</p>
 return <><p className="fw-bold mb-2">Notifications</p>{error?<p className="small text-secondary">{error}</p>:items.length?items.map(n=><Link key={n.id} to={n.link} className="d-block small border-bottom py-2">{!n.read_at&&'● '}{n.message}</Link>):<p className="small text-secondary">No account notifications yet.</p>}<Link className="d-block small mt-2" to="/workspace?tab=notifications">All notifications</Link></>
}
