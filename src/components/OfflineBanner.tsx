import {useEffect,useRef,useState} from 'react';import {WifiOff,Wifi} from 'lucide-react';
export default function OfflineBanner(){const[on,setOn]=useState(navigator.onLine);const[back,setBack]=useState(false);const was=useRef(navigator.onLine);
useEffect(()=>{const set=(v:boolean)=>{if(v===was.current)return;was.current=v;setOn(v);setBack(v);if(v)setTimeout(()=>setBack(false),3000)};
 // The browser flag can be wrong (wifi with no internet), so we also check the real connection.
 const ping=async()=>{if(!navigator.onLine){set(false);return}try{await fetch('/favicon.svg',{method:'HEAD',cache:'no-store'});set(true)}catch{set(false)}};
 const down=()=>set(false);window.addEventListener('online',ping);window.addEventListener('offline',down);const t=setInterval(ping,15000);
 return()=>{window.removeEventListener('online',ping);window.removeEventListener('offline',down);clearInterval(t)}},[]);
if(on&&!back)return null;
return <div role="status" aria-live="assertive" className={`fixed top-0 inset-x-0 z-[80] flex items-center justify-center gap-2 px-4 pb-2 text-sm font-semibold text-white ${on?'bg-green-600':'bg-ember'}`} style={{paddingTop:'max(0.5rem,env(safe-area-inset-top))'}}>{on?<Wifi size={18}/>:<WifiOff size={18}/>}{on?'Back online':'You are offline. Check your internet connection. Some features will not work.'}</div>}
