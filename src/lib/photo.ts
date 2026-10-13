import {supabase} from './supabase';
export async function shrink(f:File):Promise<Blob>{if(!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)&&!f.type.startsWith('image/'))throw new Error('Please choose an image file.');if(f.size>12e6)throw new Error('Photo is too large (max 12 MB).');
 const b=await createImageBitmap(f);const s=Math.min(1,512/Math.max(b.width,b.height));const c=document.createElement('canvas');c.width=Math.round(b.width*s);c.height=Math.round(b.height*s);c.getContext('2d')!.drawImage(b,0,0,c.width,c.height);
 return new Promise((r,j)=>c.toBlob(x=>x?r(x):j(new Error('Could not read that photo.')),'image/jpeg',0.85))}
export const toDataUrl=(b:Blob)=>new Promise<string>((r,j)=>{const f=new FileReader();f.onload=()=>r(String(f.result));f.onerror=()=>j(new Error('Read failed'));f.readAsDataURL(b)});
export async function uploadAvatar(uid:string,blob:Blob){const path=`${uid}/avatar.jpg`;const{error}=await supabase.storage.from('avatars').upload(path,blob,{upsert:true,contentType:'image/jpeg'});if(error)throw error;
 const url=supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl+'?v='+Date.now();const r=await supabase.rpc('set_my_photo',{p_url:url});if(r.error)throw r.error;return url}
