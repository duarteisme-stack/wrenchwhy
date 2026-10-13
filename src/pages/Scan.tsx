import {useEffect,useRef,useState} from 'react';import {Link} from 'react-router-dom';import {Html5Qrcode} from 'html5-qrcode';import {supabase} from '../lib/supabase';import {fmt} from '../lib/util';
type R=Record<string,any>;
export default function Scan(){const[res,setRes]=useState<R|null>(null);const[err,setErr]=useState('');const[code,setCode]=useState('');const busy=useRef(false);
const lookup=async(t:string)=>{if(busy.current)return;busy.current=true;const{data,error}=await supabase.rpc('verify_qr',{p_token:t.trim()});if(error){setRes(null);setErr(error.message)}else{setErr('');setRes(data)}setTimeout(()=>{busy.current=false},1500)};
useEffect(()=>{const s=new Html5Qrcode('reader');s.start({facingMode:'environment'},{fps:10,qrbox:240},t=>{lookup(t)},()=>{}).catch(()=>setErr('Camera unavailable. Use the manual box below.'));
 return()=>{if(s.isScanning)s.stop().then(()=>s.clear()).catch(()=>{})}},[]);
const act=async(fn:string,args:R)=>{const{error}=await supabase.rpc(fn,args);if(error)setErr(error.message);else if(res){busy.current=false;await lookup(res.reference)}};
const bad=res&&['cancelled','completed','no_show'].includes(res.status);
return <div className="max-w-xl mx-auto p-5"><Link to="/admin" className="text-fire">Back to admin</Link><h1 className="font-display text-5xl mt-3">Scan appointment QR</h1>
<div id="reader" className="mt-4 rounded overflow-hidden"/>
<div className="flex gap-2 mt-4"><input className="flex-1 bg-coal border border-white/15 rounded p-2" placeholder="Manual lookup: reference like WW-1A2B3C4D" value={code} onChange={e=>setCode(e.target.value)}/><button className="btn !py-2" onClick={()=>{busy.current=false;lookup(code)}}>Look up</button></div>
<p className="text-ember mt-3" role="alert">{err}</p>
{res&&<div className="card mt-4"><h2 className="font-display text-3xl">{res.reference}: {res.status.replace('_',' ')}</h2>{bad&&<p className="text-amber">This appointment is {res.status.replace('_',' ')}. Do not check in.</p>}
<p>{res.customer} ({res.phone})</p><p>{res.vehicle}</p><p>{res.service} with {res.mechanic}</p><p>{fmt(res.start_at)} to {fmt(res.end_at)}</p><p>Payment: {res.payment_status.replace(/_/g,' ')}</p>
{!bad&&<div className="flex flex-wrap gap-2 mt-3">{res.status==='confirmed'&&<button className="btn !py-2" onClick={()=>act('admin_set_status',{p_id:res.id,p_status:'checked_in'})}>Check in</button>}
{['confirmed','checked_in'].includes(res.status)&&<button className="btn-ghost !py-2" onClick={()=>act('admin_set_status',{p_id:res.id,p_status:'in_progress'})}>Start service</button>}
{res.status==='in_progress'&&<button className="btn-ghost !py-2" onClick={()=>act('admin_set_status',{p_id:res.id,p_status:'completed'})}>Complete</button>}
{res.payment_status!=='paid_at_shop'&&<button className="btn-ghost !py-2" onClick={()=>act('admin_mark_paid',{p_id:res.id})}>Mark paid</button>}</div>}</div>}</div>}
