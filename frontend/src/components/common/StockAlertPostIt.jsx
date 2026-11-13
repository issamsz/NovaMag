import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Bell,
  Clock,
  Pin,
  ChevronRight,
  Package,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function StockAlertPostIt({
  activePostIts = [],
  allAlerts = [],
  onDismissPostIt,
  onRestoreAllPostIts,
  onOpenNotifications,
  onActionClick
}) {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si aucun post-it n'est actif, rien à afficher (l'afficheur est désormais dans le Header TopBar)
  if (!activePostIts || activePostIts.length === 0) {
    return null;
  }

  // Si l'index actuel dépasse le nombre d'éléments restants
  const safeIndex = Math.min(currentIndex, activePostIts.length - 1);
  const currentAlert = activePostIts[safeIndex] || activePostIts[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activePostIts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activePostIts.length) % activePostIts.length);
  };

  const handleDismiss = (id) => {
    if (onDismissPostIt) {
      onDismissPostIt(id);
    }
    if (currentIndex >= activePostIts.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 max-w-[360px] w-full pointer-events-none select-none">
      
      {/* ── CARTE POST-IT STYLE JAUNE PASTEL (AFFICHÉE AU DÉMARRAGE DU LOGICIEL) ── */}
      <div className="pointer-events-auto w-full bg-amber-50 dark:bg-[#251e10] border-2 border-amber-300 dark:border-amber-600/90 text-amber-950 dark:text-amber-100 p-4 rounded-2xl shadow-2xl shadow-amber-950/20 relative overflow-hidden transition-all duration-200 animate-in slide-in-from-bottom-4">
        
        {/* Bande adhésive décorative en haut */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-200/80 dark:bg-amber-700/60 rotate-1 rounded-sm shadow-2xs pointer-events-none opacity-90 border-t border-b border-amber-300/60" />

        {/* En-tête du Post-it */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-200">
            <span className="text-sm">📌</span>
            <span className="uppercase tracking-wider text-[11px] font-black text-amber-800 dark:text-amber-300">
              Note Post-it • {currentAlert.titre || currentAlert.title || 'Alerte Stock'}
            </span>
          </div>

          {/* Bouton de Fermeture X */}
          <button
            type="button"
            onClick={() => handleDismiss(currentAlert.id)}
            className="w-6 h-6 rounded-lg text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white hover:bg-amber-200/70 dark:hover:bg-amber-800/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Fermer ce post-it (retrouvez cette alerte dans la cloche 🔔)"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Message de l'alerte */}
        <div className="mt-2.5 space-y-1">
          <p className="text-xs font-bold text-amber-950 dark:text-amber-100 leading-snug">
            {currentAlert.message}
          </p>

          {/* Horodatage & Type */}
          <div className="flex items-center gap-2 pt-1 text-[10px] text-amber-700/90 dark:text-amber-400 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{currentAlert.date || currentAlert.time || 'À l\'instant'}</span>
            </span>
            <span>•</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-black">
              {currentAlert.type === 'danger' || currentAlert.type === 'rupture' ? 'Rupture 0 Stock' : 'Stock Faible'}
            </span>
          </div>
        </div>

        {/* ── PIED DU POST-IT : NAVIGATION SI MULTIPLES + ACTIONS ── */}
        <div className="mt-3.5 pt-2.5 border-t border-amber-200/80 dark:border-amber-700/60 flex items-center justify-between gap-2">
          
          {/* Pagination si plus d'un post-it */}
          {activePostIts.length > 1 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-800/60 cursor-pointer"
                title="Précédent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px]">
                {safeIndex + 1}/{activePostIts.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-800/60 cursor-pointer"
                title="Suivant"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
              Sauvegardé dans 🔔
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleDismiss(currentAlert.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 dark:hover:bg-amber-800/60 transition-colors cursor-pointer"
            >
              Ignorer
            </button>

            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black text-amber-900 bg-amber-200 hover:bg-amber-300 dark:bg-amber-700 dark:hover:bg-amber-600 dark:text-white shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-3 h-3" />
                <span>Voir Cloche 🔔</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
