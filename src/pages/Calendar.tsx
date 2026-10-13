import {useEffect,useState} from 'react';import {Link} from 'react-router-dom';import QRCode from 'qrcode';import {supabase} from '../lib/supabase';import {useAuth} from '../lib/auth';import {Logo} from '../App';import {at,addDays,manilaDate,monday,dn} from '../lib/util';
type R=Record<string,any>;const hours=[8,9,10,11,12,13,14,15,16];
export default function Calendar(){const{user,profile}=useAuth();
const[services,setS]=useState<R[]>([]);const[workers,setW]=useState<R[]>([]);const[busy,setB]=useState<R[]>([]);const[svcId,setSvc]=useState('');const[week,setWeek]=useState(monday(manilaDate(new Date())));
const[sel,setSel]=useState<{date:string;h:number}|null>(null);const[vehicles,setV]=useState<R[]>([]);const[veh,setVeh]=useState('');const[nv,setNv]=useState({make:'',model:'',plate:''});
const[msg,setMsg]=useState('');const[di,setDi]=useState(0);const[done,setDone]=useState<{ref:string;qr:string}|null>(null);
useEffect(()=>{supabase.from('services').select('id,name,price,duration_minutes').eq('active',true).then(({data})=>{setS(data??[]);if(data?.[0])setSvc(data[0].id)});supabase.from('public_workers').select('*').then(({data})=>setW(data??[]))},[]);
const loadBusy=()=>{supabase.rpc('get_busy',{p_from:at(week,0).toISOString(),p_to:at(addDays(week,7),0).toISOString()}).then(({data})=>setB(data??[]))};
useEffect(loadBusy,[week]);
const loadV=()=>{if(user)supabase.from('vehicles').select('*').eq('owner_id',user.id).then(({data})=>{setV(data??[]);if(data?.[0])setVeh(v=>v||data[0].id)})};
useEffect(loadV,[user]);
const svc=services.find(s=>s.id===svcId);const days=Array.from({length:7},(_,i)=>addDays(week,i));
const free=(d:string,h:number):R[]|string=>{if(!svc)return '';const st=at(d,h),en=new Date(st.getTime()+svc.duration_minutes*60000);
 if(dn(d)==='Sun')return 'Closed';if(st.getTime()<Date.now())return 'Past';if(en>at(d,17))return 'Too late';
 return workers.filter(w=>(w.qualified_service_ids??[]).includes(svc.id)&&!busy.some(b=>b.worker_id===w.id&&new Date(b.start_at)<en&&new Date(b.end_at)>st))};
const avail=sel?free(sel.date,sel.h):'';const approved=profile?.approvalStatus==='approved';
const cell=(d:string,h:number)=>{const f=free(d,h);const on=sel?.date===d&&sel.h===h;return typeof f==='string'?<div className="p-2 text-center text-gray-600">{f}</div>:<button disabled={f.length===0} onClick={()=>{setSel({date:d,h});setDone(null);setMsg('')}} className={`w-full p-2 rounded border ${on?'border-fire bg-fire/20':'border-white/10'} ${f.length?'hover:border-fire':'opacity-50'}`}>{f.length?`${f.length} free`:'Full'}</button>};
const book=async(w:R)=>{setMsg('');if(!sel||!svc||!user)return;let vid=veh;
 if(!vid){if(!nv.make||!nv.model||!nv.plate){setMsg('Enter make, model and plate number first.');return}
  const{data,error}=await supabase.from('vehicles').insert({owner_id:user.id,make:nv.make,model:nv.model,plate_number:nv.plate}).select().single();if(error){setMsg(error.message);return}vid=data.id;loadV()}
 const{data,error}=await supabase.rpc('book_appointment',{p_service:svc.id,p_vehicle:vid,p_worker:w.id,p_start:at(sel.date,sel.h).toISOString()});
 if(error){setMsg(error.message);loadBusy();return}
 setDone({ref:data.reference,qr:await QRCode.toDataURL(data.qr_token,{width:280})});setSel(null);loadBusy()};
const inp="bg-coal border border-white/15 rounded p-2";
return <div className="max-w-6xl mx-auto p-5"><div className="flex justify-between items-center"><Logo/>{user?<Link to="/dashboard" className="btn-ghost !py-2">Dashboard</Link>:<Link to="/login" className="btn !py-2">Login to book</Link>}</div>
<h1 className="font-display text-5xl mt-6">Appointment calendar</h1><p className="text-gray-400">Open to everyone. Shop hours: Monday to Saturday, 8:00 to 17:00 (Manila time). Each box shows how many mechanics are free.</p>
{services.length===0&&<p className="card mt-4">No services have been added yet.</p>}
<div className="flex flex-wrap gap-3 mt-4 items-center"><label>Service <select className={inp} value={svcId} onChange={e=>{setSvc(e.target.value);setSel(null)}}>{services.map(s=><option key={s.id} value={s.id}>{s.name} (₱{s.price}, {s.duration_minutes} min)</option>)}</select></label>
<button className="btn-ghost !py-2" onClick={()=>setWeek(addDays(week,-7))}>Previous week</button><button className="btn-ghost !py-2" onClick={()=>setWeek(addDays(week,7))}>Next week</button></div>
<div className="md:hidden mt-4"><div className="grid grid-cols-7 gap-1">{days.map((d,i)=><button key={d} onClick={()=>setDi(i)} aria-pressed={di===i} className={`p-2 rounded text-xs border ${di===i?'border-fire bg-fire/20':'border-white/10'}`}>{dn(d)}<br/>{d.slice(8)}</button>)}</div><p className="mt-3 text-sm text-gray-400">{days[di]}</p>{hours.map(h=><div key={h} className="flex items-center gap-3 mt-2"><span className="w-14 shrink-0">{h}:00</span><div className="flex-1">{cell(days[di],h)}</div></div>)}</div>
<div className="hidden md:block overflow-x-auto mt-4"><table className="w-full text-sm border-collapse"><thead><tr><th className="p-2"></th>{days.map(d=><th key={d} className="p-2">{dn(d)} {d.slice(5)}</th>)}</tr></thead><tbody>{hours.map(h=><tr key={h}><th className="p-2 text-left">{h}:00</th>{days.map(d=><td key={d} className="p-1">{cell(d,h)}</td>)}</tr>)}</tbody></table></div>
{done&&<div className="card mt-5"><h2 className="font-display text-3xl">Booked! Reference {done.ref}</h2><p className="text-gray-300">Pay at the shop. Show this QR code on arrival. It is also saved under My appointments.</p><img src={done.qr} alt="Appointment QR code" className="bg-white p-2 rounded mt-3" width={280} height={280}/></div>}
{sel&&Array.isArray(avail)&&<div className="card mt-5"><h2 className="font-display text-3xl">{sel.date} at {sel.h}:00, free mechanics</h2>
{avail.map(w=><div key={w.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/10"><div><b>{w.full_name}</b><div className="text-gray-400 text-sm">{(w.specialties??[]).join(', ')}</div></div>
 {!user?<Link to="/login" className="btn !py-2">Log in to book</Link>:!approved?<span className="text-amber text-sm">Your account is awaiting approval</span>:<button className="btn !py-2" onClick={()=>book(w)}>Book with {w.full_name}</button>}</div>)}
{user&&approved&&<div className="mt-4">{vehicles.length>0?<label>Vehicle <select className={inp} value={veh} onChange={e=>setVeh(e.target.value)}>{vehicles.map(v=><option key={v.id} value={v.id}>{v.make} {v.model} {v.plate_number}</option>)}</select></label>:
 <div className="flex flex-wrap gap-2"><input className={inp} placeholder="Make" value={nv.make} onChange={e=>setNv({...nv,make:e.target.value})}/><input className={inp} placeholder="Model" value={nv.model} onChange={e=>setNv({...nv,model:e.target.value})}/><input className={inp} placeholder="Plate number" value={nv.plate} onChange={e=>setNv({...nv,plate:e.target.value})}/></div>}</div>}
<p className="text-ember mt-2" role="alert">{msg}</p></div>}</div>}
