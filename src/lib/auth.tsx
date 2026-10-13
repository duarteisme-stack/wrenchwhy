import {createContext,useContext,useEffect,useState,ReactNode} from 'react';import type {User} from '@supabase/supabase-js';import {supabase} from './supabase';
export type Profile={fullName:string;role:'admin'|'customer';approvalStatus:'pending'|'approved'|'rejected'|'suspended'};
const Ctx=createContext<{user:User|null;profile:Profile|null;admin:boolean;loading:boolean}>({user:null,profile:null,admin:false,loading:true});
export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}:{children:ReactNode}){const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[loading,setLoading]=useState(true);
useEffect(()=>{const{data}=supabase.auth.onAuthStateChange((_e,s)=>{setUser(s?.user??null);if(!s?.user){setProfile(null);setLoading(false)}});return()=>data.subscription.unsubscribe()},[]);
useEffect(()=>{if(!user)return;supabase.from('profiles').select('full_name,role,approval_status').eq('id',user.id).single().then(({data})=>{setProfile(data?{fullName:data.full_name,role:data.role,approvalStatus:data.approval_status}:null);setLoading(false)})},[user]);
return <Ctx.Provider value={{user,profile,admin:profile?.role==='admin',loading}}>{children}</Ctx.Provider>}
