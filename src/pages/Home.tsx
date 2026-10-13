import {Link} from 'react-router-dom';import {Wrench} from 'lucide-react';import {Logo} from '../App';
const services=['Oil change','Brake inspection and repair','Engine diagnostics','Battery testing and replacement','Tire rotation','Suspension inspection','Preventive maintenance','General mechanical repair'];
export default function Home(){return <div>
<nav className="flex items-center justify-between p-5 max-w-6xl mx-auto"><Logo/><div className="flex gap-5 items-center text-sm"><a href="#services">Services</a><a href="#about">About Us</a><a href="#contact">Contact</a><Link to="/login">Login</Link><Link to="/register" className="btn !py-2">Register</Link></div></nav>
<header className="relative overflow-hidden min-h-[70vh] flex items-center"><div className="flames" aria-hidden/>
{[['8%','15%','4rem'],['85%','25%','6rem'],['70%','70%','3rem'],['20%','65%','5rem']].map(([l,t,s],i)=><span key={i} className="q" style={{left:l,top:t,fontSize:s,opacity:.25+i*.1,animationDelay:`${i}s`}} aria-hidden>?</span>)}
<div className="relative max-w-6xl mx-auto px-5"><Wrench className="wrench text-fire mb-4" size={64} aria-hidden/><h1 className="font-display text-6xl md:text-8xl leading-none max-w-3xl">Got a Car Problem? We've Got the Wrench.</h1>
<p className="mt-5 max-w-xl text-gray-300">Your trusted garage for reliable mechanical service. Book your appointment, choose your schedule, and get back on the road.</p>
<div className="mt-8 flex gap-4 flex-wrap"><Link to="/register" className="btn">Book an Appointment</Link><a href="#services" className="btn-ghost">Explore Services</a></div></div></header>
<section id="services" className="max-w-6xl mx-auto p-5 py-16"><h2 className="font-display text-4xl mb-6">Services</h2><p className="text-gray-400 mb-4">Sample list. Live services, prices and durations load from Firestore once the admin creates them.</p>
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{services.map(s=><div key={s} className="card"><h3 className="font-semibold">{s}</h3><Link to="/register" className="text-fire text-sm mt-3 inline-block">Book</Link></div>)}</div></section>
<section id="about" className="max-w-6xl mx-auto p-5"><h2 className="font-display text-4xl">About Us</h2><p className="text-gray-400 mt-2">Add your shop description, hours and address in Shop Settings.</p></section>
<footer id="contact" className="max-w-6xl mx-auto p-5 py-16 text-gray-500 text-sm">© WrenchWHY? · Contact details come from shopSettings.</footer></div>}
