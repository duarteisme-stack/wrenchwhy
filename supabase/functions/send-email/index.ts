// Deploy in Supabase > Edge Functions > send-email. Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL (verified in Brevo). Optional: SITE_URL.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import qrcode from 'https://esm.sh/qrcode-generator@1.4.4';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const site=Deno.env.get('SITE_URL')??'https://wrenchwhy.vercel.app';
const esc=(s:string)=>String(s??'').replace(/[<>&"]/g,'');
// QR code drawn as a table of tiny black and white squares: no image, no attachment, nothing to download or host.
const qrBlock=(t:string)=>{const q=qrcode(0,'M');q.addData(t);q.make();const n=q.getModuleCount();
 let h='<table cellspacing="0" cellpadding="0" border="0" align="center" style="border-collapse:collapse;font-size:0;line-height:0;mso-line-height-rule:exactly">';
 for(let r=0;r<n;r++){h+='<tr>';for(let c=0;c<n;c++)h+=`<td width="6" height="6" bgcolor="${q.isDark(r,c)?'#000000':'#ffffff'}"></td>`;h+='</tr>'}
 return `<div style="text-align:center;margin:18px 0"><div style="display:inline-block;background:#ffffff;padding:16px;border-radius:10px">${h}</table></div></div>`};
const wrap=(title:string,body:string)=>`<div style="background:#0e0e10;padding:24px;font-family:Arial,sans-serif"><div style="max-width:520px;margin:auto;background:#1a1412;border:1px solid #ff6a00;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(90deg,#ff6a00,#ffb800);padding:16px 24px;color:#000;font-size:22px;font-weight:bold">WrenchWHY?</div><div style="padding:24px;color:#f1f1f4;line-height:1.55"><h2 style="margin:0 0 12px;color:#ffb800">${title}</h2>${body}<p style="margin-top:24px"><a href="${site}/dashboard" style="background:#ff6a00;color:#000;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open my dashboard</a></p></div></div></div>`;
const send=(to:string,subject:string,html:string)=>fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':Deno.env.get('BREVO_API_KEY')!,'content-type':'application/json'},body:JSON.stringify({sender:{name:'WrenchWHY?',email:Deno.env.get('BREVO_SENDER_EMAIL')},to:[{email:to}],subject,htmlContent:html})});
Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{const url=Deno.env.get('SUPABASE_URL')!;
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:req.headers.get('Authorization')!}}});
  const{data:{user:me}}=await caller.auth.getUser();if(!me)return new Response('Unauthorized',{status:401,headers:cors});
  const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);const b=await req.json();
  if(b.type==='booking'){const{data:a}=await db.from('appointments').select('*,profiles(full_name,email),workers(full_name)').eq('id',b.id).eq('customer_id',me.id).single();
   if(!a)return new Response('Not found',{status:404,headers:cors});
   const when=new Date(a.start_at).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'full',timeStyle:'short'});
   const body=`<p>Hi ${esc(a.profiles.full_name)}, your appointment is booked.</p><p style="font-size:26px;font-weight:bold;color:#ff6a00;margin:8px 0">${esc(a.reference)}</p><p><b>${esc(a.service_name_snapshot)}</b> with ${esc(a.workers?.full_name)}<br>${when}<br>Amount to pay at the shop: PHP ${a.amount_due}</p><p><b>Your check-in QR code:</b> show it when you arrive.</p>${a.qr_token?qrBlock(a.qr_token):''}<p style="font-size:13px;color:#c9ced8">If the QR code does not show, open My appointments in your dashboard, or give us the reference above.</p>`;
   await send(a.profiles.email,`Booking confirmed ${a.reference}`,wrap('Booking confirmed',body));
  }else if(b.type==='approval'){const{data:p}=await db.from('profiles').select('role').eq('id',me.id).single();if(p?.role!=='admin')return new Response('Forbidden',{status:403,headers:cors});
   const{data:c}=await db.from('profiles').select('full_name,email,approval_status').eq('id',b.uid).single();if(!c||!['approved','rejected'].includes(c.approval_status))return new Response('Skipped',{headers:cors});
   const ok=c.approval_status==='approved';
   await send(c.email,ok?'Your account is approved':'Your application was declined',wrap(ok?'Account approved':'Application declined',ok?`<p>Hi ${esc(c.full_name)}, your WrenchWHY? account is approved. You can now book appointments.</p>`:`<p>Hi ${esc(c.full_name)}, we could not approve your account. Please contact the shop.</p>`));}
  return new Response('ok',{headers:cors});}catch(e){return new Response(String(e),{status:500,headers:cors});}});
