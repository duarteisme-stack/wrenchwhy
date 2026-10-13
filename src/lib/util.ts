export const D=86400000;
export const manilaDate=(d:Date)=>d.toLocaleDateString('en-CA',{timeZone:'Asia/Manila'});
export const at=(date:string,h:number)=>new Date(`${date}T${String(h).padStart(2,'0')}:00:00+08:00`);
export const addDays=(date:string,n:number)=>manilaDate(new Date(at(date,12).getTime()+n*D));
export const dn=(date:string)=>at(date,12).toLocaleDateString('en-US',{weekday:'short',timeZone:'Asia/Manila'});
export const monday=(date:string)=>addDays(date,-((['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dn(date))+6)%7));
export const fmt=(iso:string)=>new Date(iso).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'});
export const h12=(h:number)=>`${h%12||12}:00 ${h<12?'AM':'PM'}`;
export const nice=(d:string)=>at(d,12).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'Asia/Manila'});
