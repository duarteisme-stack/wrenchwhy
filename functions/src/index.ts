import {onCall,HttpsError} from 'firebase-functions/v2/https';import {initializeApp} from 'firebase-admin/app';import {getFirestore,FieldValue,Timestamp} from 'firebase-admin/firestore';import {randomBytes,createHash} from 'crypto';
initializeApp();const db=getFirestore();

// Customers are always created as 'pending' with role 'customer'. Clients cannot write /users.
export const createCustomerProfile=onCall(async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Login required');
 const{fullName,phone}=req.data as{fullName:string;phone:string};
 if(!fullName||fullName.length<2||!phone)throw new HttpsError('invalid-argument','Invalid input');
 await db.doc(`users/${req.auth.uid}`).set({fullName,phone,email:req.auth.token.email??'',role:'customer',approvalStatus:'pending',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:false});
 return{ok:true}});

export const setApproval=onCall(async req=>{
 if(req.auth?.token.admin!==true)throw new HttpsError('permission-denied','Admin only');
 const{uid,status}=req.data as{uid:string;status:string};
 if(!['approved','rejected','suspended'].includes(status))throw new HttpsError('invalid-argument','Bad status');
 await db.doc(`users/${uid}`).update({approvalStatus:status,updatedAt:FieldValue.serverTimestamp()});
 await db.collection('auditLogs').add({actorUid:req.auth.uid,action:`approval:${status}`,affectedRecordType:'user',affectedRecordId:uid,timestamp:FieldValue.serverTimestamp()});
 return{ok:true}});

// Atomic booking: server validates service, price, worker qualification and overlap inside a transaction.
export const bookAppointment=onCall(async req=>{
 if(!req.auth)throw new HttpsError('unauthenticated','Login required');
 const{serviceId,vehicleId,workerId,startMs}=req.data as{serviceId:string;vehicleId:string;workerId:string;startMs:number};
 const uid=req.auth.uid;
 return db.runTransaction(async tx=>{
  const user=(await tx.get(db.doc(`users/${uid}`))).data();
  if(user?.approvalStatus!=='approved')throw new HttpsError('permission-denied','Account not approved');
  const svc=(await tx.get(db.doc(`services/${serviceId}`))).data();
  if(!svc||!svc.active)throw new HttpsError('not-found','Service unavailable');
  const w=(await tx.get(db.doc(`workers/${workerId}`))).data();
  if(!w||!w.active||!(w.qualifiedServiceIds??[]).includes(serviceId))throw new HttpsError('failed-precondition','Mechanic not eligible');
  const veh=(await tx.get(db.doc(`vehicles/${vehicleId}`))).data();
  if(!veh||veh.ownerUid!==uid)throw new HttpsError('permission-denied','Not your vehicle');
  const start=startMs,end=start+svc.estimatedDurationMinutes*60000;
  if(start<Date.now())throw new HttpsError('invalid-argument','Time is in the past');
  // TODO: also check shop hours, worker shift/breaks/leave, holidays, buffer, capacity.
  const clash=await tx.get(db.collection('reservations').where('workerId','==',workerId).where('status','in',['hold','confirmed']).where('startMs','<',end));
  for(const d of clash.docs){const r=d.data();if(r.endMs>start&&(r.status==='confirmed'||r.expiresMs>Date.now()))throw new HttpsError('already-exists','Slot taken')}
  const ref=db.collection('appointments').doc();const token=randomBytes(24).toString('hex');
  tx.set(ref,{appointmentReference:'WW-'+ref.id.slice(0,8).toUpperCase(),customerUid:uid,vehicleId,serviceId,serviceNameSnapshot:svc.name,priceSnapshot:svc.price,durationSnapshot:svc.estimatedDurationMinutes,workerId,startAt:Timestamp.fromMillis(start),endAt:Timestamp.fromMillis(end),status:'awaiting_payment',paymentStatus:'unpaid',amountDue:svc.price,amountPaid:0,qrTokenHash:createHash('sha256').update(token).digest('hex'),createdAt:FieldValue.serverTimestamp()});
  tx.set(db.collection('reservations').doc(),{appointmentId:ref.id,workerId,startMs:start,endMs:end,status:'hold',expiresMs:Date.now()+15*60000});
  return{appointmentId:ref.id}})});
