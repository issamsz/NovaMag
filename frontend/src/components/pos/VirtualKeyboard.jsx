import React, { useState } from 'react';
import { Delete, CornerDownLeft, Space, ArrowBigUp, X, Sparkles } from 'lucide-react';

export default function VirtualKeyboard({ 
  onKeyPress, 
  onEnter, 
  onDelete, 
  onClear, 
  onClose,
  activeText = '', 
  matchCount = null 
}) {
  const [layout, setLayout] = useState('fr'); // 'fr', 'ar', 'num'
  const [capsLock, setCapsLock] = useState(false);

  // Clavier Azerty FR
  const AZERTY_NUM_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const AZERTY_ROW_1 = ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const AZERTY_ROW_2 = ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
  const AZERTY_ROW_3 = ['W', 'X', 'C', 'V', 'B', 'N', '\'', '.', '-', '/'];

  // Clavier Arabe
  const AR_NUM_ROW = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'];
  const AR_ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'];
  const AR_ROW_2 = ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'];
  const AR_ROW_3 = ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ'];

  // Pavé Numérique
  const NUM_PAD = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '00', '.']
  ];

  const handleKeyClick = (char) => {
    let finalChar = char;
    if (layout === 'fr') {
      finalChar = capsLock ? char.toUpperCase() : char.toLowerCase();
    }
    if (onKeyPress) onKeyPress(finalChar);
  };

  return (
    <div className="w-full bg-[#091124] border border-[#1E293B] rounded-xl p-2 sm:p-2.5 shadow-2xl select-none flex flex-col gap-1.5 transition-all">
      
      {/* ══ 1. BANDEAU SUPÉRIEUR (Conforme Photo 2) ══ */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs px-1">
        
        {/* Saisie tactile rapide */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-white shadow-2xs">
            <span className="text-xs">⌨️</span>
            {activeText ? (
              <span className="font-mono font-bold text-xs truncate max-w-[150px] text-cyan-300">
                "{activeText}"
              </span>
            ) : (
              <span className="text-[11px] text-slate-300 font-semibold">
                Saisie tactile rapide
              </span>
            )}

            {activeText && typeof onClear === 'function' && (
              <button
                type="button"
                onClick={onClear}
                className="p-0.5 rounded-full hover:bg-white/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                title="Effacer la saisie"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {matchCount !== null && matchCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10.5px] font-black border border-emerald-500/30">
              {matchCount} article{matchCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Boutons sélecteur de mode AZERTY / عربي / 123 Pavé (Conforme Photo 2) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setLayout('fr')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                layout === 'fr'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              AZERTY
            </button>

            <button
              type="button"
              onClick={() => setLayout('ar')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                layout === 'ar'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              عربي
            </button>

            <button
              type="button"
              onClick={() => setLayout('num')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                layout === 'num'
                  ? 'bg-[#4F46E5] text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              123 Pavé
            </button>
          </div>

          {typeof onClose === 'function' && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Masquer le clavier"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* ══ 2. CORPS DU CLAVIER (Conforme Photo 2, rectangulaire non courbé) ══ */}
      {layout === 'num' ? (
        /* Pavé Numérique */
        <div className="flex gap-2 justify-center py-0.5">
          <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs">
            {NUM_PAD.flat().map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKeyClick(k)}
                className="h-8 bg-white hover:bg-slate-100 text-slate-900 font-mono text-base font-black rounded-lg border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1 w-24">
            <button
              type="button"
              onClick={onDelete}
              className="flex-1 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] font-bold rounded-lg border border-rose-200 text-xs active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Delete className="w-4 h-4" />
              <span>⌫</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              className="py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 text-[11px] active:scale-95 cursor-pointer"
            >
              Vider
            </button>
            <button
              type="button"
              onClick={onEnter}
              className="flex-1 bg-[#00C853] hover:bg-[#00B048] text-white font-black rounded-lg shadow-md active:scale-95 flex items-center justify-center gap-1 text-xs cursor-pointer"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>OK</span>
            </button>
          </div>
        </div>
      ) : layout === 'ar' ? (
        /* Clavier Arabe */
        <div className="flex flex-col gap-1 items-center justify-center" dir="rtl">
          <div className="flex gap-1 justify-center w-full">
            {AR_NUM_ROW.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="h-7 flex-1 max-w-[42px] bg-[#94A3B8] hover:bg-[#CBD5E1] text-slate-900 font-mono font-black text-xs rounded-lg active:scale-95 cursor-pointer flex items-center justify-center"
              >
                {num}
              </button>
            ))}
          </div>

          {[AR_ROW_1, AR_ROW_2, AR_ROW_3].map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center w-full">
              {row.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleKeyClick(ch)}
                  className="h-7.5 min-w-[28px] flex-1 max-w-[44px] bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm rounded-lg border border-slate-200 shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {ch}
                </button>
              ))}
            </div>
          ))}

          <div className="flex gap-1.5 w-full max-w-xl justify-center pt-0.5" dir="ltr">
            <button
              type="button"
              onClick={onDelete}
              className="px-3.5 h-7.5 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] font-bold rounded-lg border border-rose-200 text-xs flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>

            <button
              type="button"
              onClick={() => handleKeyClick(' ')}
              className="flex-1 max-w-sm h-7.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1 text-xs active:scale-95 cursor-pointer"
            >
              <Space className="w-3.5 h-3.5 text-slate-400" />
              <span>مسافة</span>
            </button>

            <button
              type="button"
              onClick={onEnter}
              className="px-4.5 h-7.5 bg-[#00C853] hover:bg-[#00B048] text-white font-bold rounded-lg shadow-sm flex items-center gap-1 text-xs active:scale-95 cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>إدخال</span>
            </button>
          </div>
        </div>
      ) : (
        /* Clavier Azerty FR Conforme Photo 2 (Pleine largeur exacte comme Articles Rapides) */
        <div className="flex flex-col gap-1 w-full items-center justify-center">
          {/* Ligne 0 : Chiffres 1 à 0 en gris ardoise comme sur la photo */}
          <div className="flex gap-1 justify-center w-full">
            {AZERTY_NUM_ROW.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="h-8 sm:h-8.5 flex-1 bg-[#94A3B8] hover:bg-[#CBD5E1] text-slate-900 font-mono font-black text-xs sm:text-sm rounded-lg active:scale-95 cursor-pointer flex items-center justify-center shadow-xs"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Ligne 1 : AZERTYUIOP en touches blanches géométriques */}
          <div className="flex gap-1 justify-center w-full">
            {AZERTY_ROW_1.map((ch) => {
              const displayChar = capsLock ? ch.toUpperCase() : ch.toLowerCase();
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleKeyClick(ch)}
                  className="h-8.5 sm:h-9 min-w-[28px] flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm rounded-lg border border-slate-200 shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {displayChar}
                </button>
              );
            })}
          </div>

          {/* Ligne 2 : QSDFGHJKLM avec CapsLock et Backspace */}
          <div className="flex gap-1 justify-center w-full">
            <button
              type="button"
              onClick={() => setCapsLock(!capsLock)}
              className={`h-8.5 sm:h-9 px-3 sm:px-4 rounded-lg border text-[10px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs shrink-0 ${
                capsLock
                  ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
              title="Majuscules"
            >
              <ArrowBigUp className={`w-3.5 h-3.5 ${capsLock ? 'fill-white' : ''}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${capsLock ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
            </button>

            {AZERTY_ROW_2.map((ch) => {
              const displayChar = capsLock ? ch.toUpperCase() : ch.toLowerCase();
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleKeyClick(ch)}
                  className="h-8.5 sm:h-9 min-w-[28px] flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm rounded-lg border border-slate-200 shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {displayChar}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onDelete}
              className="h-8.5 sm:h-9 px-3.5 sm:px-4.5 bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#E11D48] font-bold rounded-lg border border-rose-200 text-xs flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs shrink-0"
              title="Effacer"
            >
              <Delete className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ligne 3 : WXCVBN ' . - / */}
          <div className="flex gap-1 justify-center w-full">
            {AZERTY_ROW_3.map((ch) => {
              const displayChar = capsLock ? ch.toUpperCase() : ch.toLowerCase();
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => handleKeyClick(ch)}
                  className="h-8.5 sm:h-9 min-w-[28px] flex-1 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm rounded-lg border border-slate-200 shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {displayChar}
                </button>
              );
            })}
          </div>

          {/* Ligne 4 : Barre d'Espace, Vider & Touche Entrée Verte (Pleine largeur) */}
          <div className="flex gap-1.5 w-full justify-center pt-0.5">
            <button
              type="button"
              onClick={onClear}
              className="px-4 sm:px-5 h-8.5 sm:h-9 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 text-xs active:scale-95 cursor-pointer shadow-xs shrink-0"
            >
              Vider
            </button>

            <button
              type="button"
              onClick={() => handleKeyClick(' ')}
              className="flex-1 h-8.5 sm:h-9 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 text-xs active:scale-95 cursor-pointer shadow-xs"
            >
              <Space className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600">— Espace —</span>
            </button>

            <button
              type="button"
              onClick={onEnter}
              className="px-5 sm:px-7 h-8.5 sm:h-9 bg-[#00C853] hover:bg-[#00B048] text-white font-black rounded-lg shadow-sm flex items-center gap-1.5 text-xs active:scale-95 cursor-pointer shrink-0"
            >
              <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Entrée</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
