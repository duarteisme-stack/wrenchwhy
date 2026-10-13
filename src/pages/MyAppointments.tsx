import {useEffect,useState} from 'react';import {Link} from 'react-router-dom';import QRCode from 'qrcode';import {supabase} from '../lib/supabase';import {fmt} from '../lib/util';
type R=Record<string,any>;
function Qr({t}:{t:string}){const[u,setU]=useState('');useEffect(()=>{QRCode.toDataURL(t,{width:220}).then(setU)},[t]);return u?<img src={u} alt="Appointment QR code" width={220} height={220} className="bg-white p-2 rounded"/>:null}
export default function MyAppointments(){const[rows,setRows]=useState<R[]>([]);const[names,setN]=useState<Record<string,string>>({});const[err,setErr]=useState('');
const load=()=>{supabase.from('appointments').select('*').order('start_at',{ascending:false}).then(({data})=>setRows(data??[]))};
useEffect(()=>{load();supabase.from('public_workers').select('id,full_name').then(({data})=>setN(Object.fromEntries((data??[]).map(w=>[w.id,w.full_name]))))},[]);
const cancel=async(id:string)=>{const{error}=await supabase.rpc('cancel_my_appointment',{p_id:id});setErr(error?error.message:'');load()};
return <div className="max-w-3xl mx-auto p-6"><Link to="/dashboard" className="text-fire">Back to dashboard</Link><h1 className="font-display text-5xl mt-3">My appointments</h1><p className="text-ember" role="alert">{err}</p>
{rows.length===0&&<p className="card mt-4">No appointments yet. <Link className="text-fire" to="/calendar">Book one</Link>.</p>}
{rows.map(a=><div key={a.id} className="card mt-4 flex flex-wrap gap-5 justify-between"><div><h2 className="font-display text-3xl">{a.reference}</h2><p>{a.service_name_snapshot} with {names[a.worker_id]??'assigned mechanic'}</p><p>{fmt(a.start_at)}</p><p className="text-gray-300">Status: {a.status.replace('_',' ')}. Payment: {a.payment_status.replace(/_/g,' ')} (₱{a.amount_due})</p>
{a.status==='confirmed'&&new Date(a.start_at)>new Date()&&<button className="btn-ghost mt-3" onClick={()=>cancel(a.id)}>Cancel appointment</button>}</div>
{['confirmed','checked_in','in_progress'].includes(a.status)&&a.qr_token&&<Qr t={a.qr_token}/>}</div>)}</div>}
