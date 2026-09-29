import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SoilReport } from './models'
export function SoilReportView({listingId}:{listingId:number}) {
 const [report,setReport]=useState<SoilReport|null>(null)
 const [error,setError]=useState('')
 useEffect(()=>{let active=true;void supabase.from('soil_reports').select('*').eq('listing_id',listingId).maybeSingle().then(({data,error:e})=>{if(active){setReport(data as SoilReport|null);setError(e?'Laboratory report could not be loaded.':'')}});return()=>{active=false}},[listingId])
 return <section className="mt-4"><h2 className="h5">Laboratory soil report</h2>{error?<p>{error}</p>:report?<><p>{report.laboratory} · {report.report_date}{report.ph!==null&&` · pH ${report.ph}`}</p><p style={{whiteSpace:'pre-wrap'}}>{report.summary}</p></>:<p>No laboratory report has been recorded.</p>}</section>
}
