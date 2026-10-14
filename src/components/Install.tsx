import {useEffect,useState} from 'react';import {Download} from 'lucide-react';
export default function Install(){const[ev,setEv]=useState<any>(null);const[ios,setIos]=useState(false);const[show,setShow]=useState(true);
useEffect(()=>{const h=(e:Event)=>{e.preventDefault();setEv(e)};window.addEventListener('beforeinstallprompt',h);
 const standalone=matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone;if(standalone)setShow(false);setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!standalone);
 const d=()=>setShow(false);window.addEventListener('appinstalled',d);return()=>{window.removeEventListener('beforeinstallprompt',h);window.removeEventListener('appinstalled',d)}},[]);
if(!show)return null;
if(ev)return <button className="btn-ghost inline-flex items-center gap-2" onClick={async()=>{ev.prompt();await ev.userChoice;setEv(null)}}><Download size={18}/>Install app</button>;
return ios?<span className="text-xs text-gray-400 self-center">To install: tap Share, then Add to Home Screen</span>:null}
