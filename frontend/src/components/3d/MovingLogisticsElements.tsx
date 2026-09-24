// MeetMux Control Tower — Moving 3D Logistics Elements & Animated Cyber Radar
import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Plane, Navigation, Radio, ShieldAlert, Cpu } from 'lucide-react';

export function MovingCorridorTicker() {
  const activeRoutes = [
    { id: 'SHP-1024', path: 'Bhiwandi H04 ➔ Gurugram DEL-1', speed: '18 km/h', temp: '24.5°C', status: 'CRITICAL_SLA', delay: '+4.1h' },
    { id: 'SHP-1343', path: 'Whitefield BLR-1 ➔ Chennai Port', speed: '52 km/h', temp: '4.2°C', status: 'IN_TRANSIT', delay: 'On Time' },
    { id: 'SHP-1252', path: 'Kolkata CCU-1 ➔ Delhi NCR', speed: '48 km/h', temp: '21.0°C', status: 'NORMAL', delay: 'On Time' },
    { id: 'SHP-1189', path: 'Pune Auto Hub ➔ Bhiwandi H04', speed: '22 km/h', temp: '28.1°C', status: 'HIGH_RISK', delay: '+2.4h' },
    { id: 'SHP-1402', path: 'Ahmedabad DC ➔ Jaipur Hub', speed: '64 km/h', temp: '22.8°C', status: 'IN_TRANSIT', delay: 'On Time' },
  ];

  return (
    <div className="relative overflow-hidden w-full glass rounded-xl py-2 px-3 border border-rose-200/50 mb-4 bg-gradient-to-r from-rose-900/10 via-pink-900/5 to-rose-900/10">
      <div className="flex items-center gap-2 mb-1.5 px-1">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider flex items-center gap-1">
          <Radio className="w-3 h-3 text-rose-600 animate-pulse" /> Live Telemetry Feed · Active Moving Freight
        </span>
      </div>

      {/* Continuously Moving Ribbon */}
      <motion.div
        className="flex gap-4 whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
      >
        {[...activeRoutes, ...activeRoutes, ...activeRoutes].map((item, idx) => {
          const isCrit = item.status === 'CRITICAL_SLA' || item.status === 'HIGH_RISK';
          return (
            <div
              key={`${item.id}-${idx}`}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border ${
                isCrit ? 'bg-red-50/80 border-red-200 text-red-800' : 'bg-white/60 border-rose-100 text-rose-900'
              } shadow-sm backdrop-blur-sm`}
            >
              <Truck className={`w-3.5 h-3.5 ${isCrit ? 'text-red-500 animate-bounce' : 'text-rose-500'}`} />
              <span className="font-mono font-bold">{item.id}</span>
              <span className="text-rose-600/60 text-[10px]">({item.path})</span>
              <span className="font-mono text-[10px] bg-white/70 px-1 rounded">{item.speed}</span>
              <span className="font-mono text-[10px] text-blue-600">{item.temp}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isCrit ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>{item.delay}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function AnimatedFreightHighway() {
  return (
    <div className="relative glass-card p-4 overflow-hidden rounded-2xl border border-rose-200/50 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-rose-600 animate-spin" style={{ animationDuration: '8s' }} />
          <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">NH-48 Freight Transit Corridor Simulation</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 164 Active Routes Monitored
        </span>
      </div>

      {/* Highway Lanes with Moving Vehicles */}
      <div className="relative h-20 bg-slate-900/90 rounded-xl overflow-hidden border border-rose-950/40 p-2 flex flex-col justify-around">
        {/* Lane 1 - Northbound Heavy Freight (Trucks moving right) */}
        <div className="relative h-6 flex items-center border-b border-rose-500/20">
          <span className="absolute left-2 text-[9px] font-mono text-rose-400/50 uppercase tracking-widest z-10">Lane 1: Northbound (Mumbai ➔ Delhi)</span>
          
          {/* Moving Truck A */}
          <motion.div
            className="absolute z-20 flex items-center gap-1 text-[10px] font-bold font-mono text-amber-300 bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            animate={{ left: ['-15%', '115%'] }}
            transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
          >
            <Truck className="w-3 h-3 text-amber-400" />
            <span>SHP-1024</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </motion.div>

          {/* Moving Truck B */}
          <motion.div
            className="absolute z-20 flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/50 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            animate={{ left: ['-20%', '110%'] }}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear', delay: 3 }}
          >
            <Truck className="w-3 h-3 text-emerald-400" />
            <span>SHP-1088</span>
          </motion.div>
        </div>

        {/* Lane 2 - Southbound Express (Trucks moving left) */}
        <div className="relative h-6 flex items-center">
          <span className="absolute left-2 text-[9px] font-mono text-rose-400/50 uppercase tracking-widest z-10">Lane 2: Southbound (Delhi ➔ Mumbai)</span>
          
          {/* Moving Drone / Fast Cargo C */}
          <motion.div
            className="absolute z-20 flex items-center gap-1 text-[10px] font-bold font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 px-2 py-0.5 rounded shadow-[0_0_12px_rgba(6,182,212,0.5)]"
            animate={{ right: ['-15%', '115%'] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
          >
            <Plane className="w-3 h-3 text-cyan-400" />
            <span>EXP-AIR-99</span>
          </motion.div>

          {/* Moving Truck D */}
          <motion.div
            className="absolute z-20 flex items-center gap-1 text-[10px] font-bold font-mono text-pink-300 bg-pink-950/70 border border-pink-500/50 px-2 py-0.5 rounded"
            animate={{ right: ['-25%', '115%'] }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear', delay: 4 }}
          >
            <Truck className="w-3 h-3 text-pink-400" />
            <span>SHP-1402</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
