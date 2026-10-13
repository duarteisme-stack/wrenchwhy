import {createContext,useContext,useEffect,useRef,useState,ReactNode} from 'react';import type {User} from '@supabase/supabase-js';import {supabase} from './supabase';import {uploadAvatar} from './photo';import {deviceId} from './device';
export type Profile={fullName:string;role:'admin'|'customer';approvalStatus:'pending'|'approved'|'rejected'|'suspended';photoUrl?:string};
const Ctx=createContext<{user:User|null;profile:Profile|null;admin:boolean;loading:boolean}>({user:null,profile:null,admin:false,loading:true});
export const useAuth=()=>useContext(Ctx);
const AWAY_DAYS=14; // log out only if the browser was unused this long
export function AuthProvider({children}:{children:ReactNode}){const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[loading,setLoading]=useState(true);const cur=useRef<string|undefined>(undefined);
useEffect(()=>{const mark=()=>localStorage.setItem('ww_last',String(Date.now()));const last=Number(localStorage.getItem('ww_last')||0);
 if(last&&Date.now()-last>AWAY_DAYS*864e5)supabase.auth.signOut();mark();let t=0;const ping=()=>{if(Date.now()-t>6e4){t=Date.now();mark()}};const ev=['click','keydown','touchstart','visibilitychange'];
 ev.forEach(e=>window.addEventListener(e,ping));return()=>ev.forEach(e=>window.removeEventListener(e,ping))},[]);
useEffect(()=>{const{data}=supabase.auth.onAuthStateChange((_e,s)=>{const id=s?.user?.id;if(id===cur.current&&id!==undefined)return;cur.current=id;setUser(s?.user??null);if(id)setLoading(true);else{setProfile(null);setLoading(false)}});return()=>data.subscription.unsubscribe()},[]);
useEffect(()=>{if(!user)return;let off=false;
 supabase.from('profiles').select('full_name,role,approval_status,photo_url').eq('id',user.id).single().then(async({data})=>{if(off)return;
  setProfile(data?{fullName:data.full_name,role:data.role,approvalStatus:data.approval_status,photoUrl:data.photo_url??undefined}:null);setLoading(false);
  const k='ww_photo:'+(user.email??'').toLowerCase();const p=localStorage.getItem(k);
  if(p){localStorage.removeItem(k);try{const url=await uploadAvatar(user.id,await (await fetch(p)).blob());setProfile(x=>x?{...x,photoUrl:url}:x)}catch{/* photo can be added later in My profile */}}});
 return()=>{off=true}},[user?.id]);
useEffect(()=>{if(!user)return;const chk=async()=>{const{data}=await supabase.rpc('session_ok',{p_device:deviceId()});if(data===false){localStorage.setItem('ww_kicked','1');await supabase.auth.signOut()}};
 const first=setTimeout(chk,5000);const t=setInterval(chk,20000);const v=()=>{if(!document.hidden)chk()};document.addEventListener('visibilitychange',v);
 return()=>{clearTimeout(first);clearInterval(t);document.removeEventListener('visibilitychange',v)}},[user?.id]);
return <Ctx.Provider value={{user,profile,admin:profile?.role==='admin',loading}}>{children}</Ctx.Provider>}
