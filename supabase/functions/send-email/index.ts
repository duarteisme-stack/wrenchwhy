// Deploy in Supabase > Edge Functions. Secrets needed: BREVO_API_KEY, BREVO_SENDER_EMAIL (a sender verified in Brevo).
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const esc=(s:string)=>String(s??'').replace(/[<>&"]/g,'');
const send=(to:string,subject:string,html:string)=>fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':Deno.env.get('BREVO_API_KEY')!,'content-type':'application/json'},body:JSON.stringify({sender:{name:'WrenchWHY?',email:Deno.env.get('BREVO_SENDER_EMAIL')},to:[{email:to}],subject,htmlContent:html})});
Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const url=Deno.env.get('SUPABASE_URL')!;
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')!}}});
  const{data:{user:me}}=await caller.auth.getUser();if(!me)return new Response('Unauthorized',{status:401,headers:cors});
  const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);const b=await req.json();
  if(b.type==='booking'){const{data:a}=await db.from('appointments').select('*,profiles(full_name,email),workers(full_name)').eq('id',b.id).eq('customer_id',me.id).single();
   if(!a)return new Response('Not found',{status:404,headers:cors});
   await send(a.profiles.email,`Booking confirmed ${a.reference}`,`<h2>Booking confirmed</h2><p>Hi ${esc(a.profiles.full_name)}, your appointment is booked.</p><p><b>${a.reference}</b><br>${esc(a.service_name_snapshot)} with ${esc(a.workers?.full_name)}<br>${new Date(a.start_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}<br>Pay at the shop: PHP ${a.amount_due}</p><p>Show your QR code from your dashboard when you arrive.</p>`);
  }else if(b.type==='approval'){const{data:p}=await db.from('profiles').select('role').eq('id',me.id).single();if(p?.role!=='admin')return new Response('Forbidden',{status:403,headers:cors});
   const{data:c}=await db.from('profiles').select('full_name,email,approval_status').eq('id',b.uid).single();if(!c||!['approved','rejected'].includes(c.approval_status))return new Response('Skipped',{headers:cors});
   const ok=c.approval_status==='approved';
   await send(c.email,ok?'Your account is approved':'Your application was declined',ok?`<p>Hi ${esc(c.full_name)}, your WrenchWHY? account is approved. You can now book appointments.</p>`:`<p>Hi ${esc(c.full_name)}, we could not approve your account. Please contact the shop.</p>`);}
  return new Response('ok',{headers:cors});}catch(e){return new Response(String(e),{status:500,headers:cors});}});
