import {supabase} from './supabase';
export const deviceId=()=>{let d=localStorage.getItem('ww_device');if(!d){d=crypto.randomUUID();localStorage.setItem('ww_device',d)}return d};
// Called right after a real login: this device becomes the only active one.
export async function claimSession(){try{await supabase.rpc('claim_session',{p_device:deviceId()})}catch{/* ignore */}}
