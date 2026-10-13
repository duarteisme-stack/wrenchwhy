import {createContext,useContext,useEffect,useState,ReactNode} from 'react';import {onAuthStateChanged,User} from 'firebase/auth';import {doc,onSnapshot} from 'firebase/firestore';import {auth,db} from './firebase';
export type Profile={fullName:string;role:'admin'|'customer';approvalStatus:'pending'|'approved'|'rejected'|'suspended'};
const Ctx=createContext<{user:User|null;profile:Profile|null;admin:boolean;loading:boolean}>({user:null,profile:null,admin:false,loading:true});
export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}:{children:ReactNode}){const[user,setUser]=useState<User|null>(null);const[profile,setProfile]=useState<Profile|null>(null);const[admin,setAdmin]=useState(false);const[loading,setLoading]=useState(true);
useEffect(()=>{let unsub=()=>{};const off=onAuthStateChanged(auth,async u=>{unsub();setUser(u);if(!u){setProfile(null);setAdmin(false);setLoading(false);return}
const t=await u.getIdTokenResult();setAdmin(t.claims.admin===true);unsub=onSnapshot(doc(db,'users',u.uid),s=>{setProfile(s.data() as Profile);setLoading(false)})});return()=>{off();unsub()}},[]);
return <Ctx.Provider value={{user,profile,admin,loading}}>{children}</Ctx.Provider>}
