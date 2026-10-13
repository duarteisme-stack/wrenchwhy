import {createClient} from '@supabase/supabase-js';
// One login per browser, shared by all tabs, kept across restarts. Tokens refresh automatically.
export const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'wrenchwhy-auth'}});
