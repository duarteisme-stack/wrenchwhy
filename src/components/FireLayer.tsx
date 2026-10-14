const E=Array.from({length:16},(_,i)=>({l:(i*37+11)%100,s:3+(i*7)%6,d:6+(i*5)%9,dl:(i*1.3)%8}));
// Flames along the bottom plus rising embers. Pure CSS, switched off for reduced-motion users.
export default function FireLayer(){return <><div aria-hidden className="fixed inset-x-0 bottom-0 -z-10 h-72 pointer-events-none flames2"/>
<div aria-hidden className="fixed inset-x-0 top-0 -z-10 overflow-hidden pointer-events-none" style={{height:'100lvh'}}>{E.map((e,i)=><span key={i} className="ember" style={{left:`${e.l}%`,width:e.s,height:e.s,animationDuration:`${e.d}s`,animationDelay:`${e.dl}s`}}/>)}</div></>}
