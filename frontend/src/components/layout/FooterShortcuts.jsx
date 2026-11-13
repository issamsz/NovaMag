import React, { useState, useEffect } from 'react';
import { Wifi, Volume2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function FooterShortcuts({ onActionClick = null, isAutoPrintEnabled = true }) {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <footer className="bg-[#06122C] text-white border-t border-[#0D2254] px-4 py-2 flex items-center justify-between text-xs select-none shrink-0 z-20">
      
      {/* ── Gauche : Statut Système ── */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold text-[11px] text-slate-300">NovaMag POS</span>
      </div>

      {/* ── Centre : Pilules d'actions conformes à la maquette ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-2">
        <button
          type="button"
          onClick={() => onActionClick && onActionClick('cancel')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Annuler <span className="font-mono text-[10px] text-rose-400 ml-0.5">F4</span></span>
        </button>

        <button
          type="button"
          onClick={() => onActionClick && onActionClick('suspend')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Attente <span className="font-mono text-[10px] text-amber-400 ml-0.5">F2</span></span>
        </button>

        <button
          type="button"
          onClick={() => onActionClick && onActionClick('history')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-300 hover:bg-blue-500/25 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Historique <span className="font-mono text-[10px] text-blue-400 ml-0.5">F3</span></span>
        </button>

        <button
          type="button"
          onClick={() => onActionClick && onActionClick('drafts')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-bold cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Brouillon <span className="font-mono text-[10px] text-emerald-400 ml-0.5">F3</span></span>
        </button>

        <button
          type="button"
          onClick={() => onActionClick && onActionClick('ticket')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-bold cursor-pointer ${
            isAutoPrintEnabled
              ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30'
              : 'bg-slate-500/15 border-slate-500/40 text-slate-300 hover:bg-slate-500/25'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isAutoPrintEnabled ? 'bg-blue-400' : 'bg-slate-400'}`} />
          <span>Ticket {isAutoPrintEnabled ? 'ON' : 'OFF'} <span className="font-mono text-[10px] opacity-80 ml-0.5">F5</span></span>
        </button>
      </div>

      {/* ── Droite : Wifi, Audio, FRA, Heure en direct ── */}
      <div className="flex items-center gap-3 shrink-0 text-slate-300 text-xs font-bold">
        <Wifi className="w-4 h-4 text-slate-300" />
        <Volume2 className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-black tracking-wider text-slate-200">FRA</span>
        <div className="flex flex-col text-right leading-none text-[10px] font-mono text-slate-300">
          <span>{timeStr}</span>
          <span className="text-[9px] text-slate-400">{dateStr}</span>
        </div>
      </div>

    </footer>
  );
}
