import React from 'react';

export default function ProductVisual({ id, name = '', className = "w-16 h-16" }) {
  const n = (name || '').toLowerCase();

  // 1. Pain Baguette
  if (n.includes('baguette') || id === 1) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 120 70" className="w-full h-full">
          <defs>
            <linearGradient id="baguetteGrad" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="25%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDE68A" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="cutGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>
            <filter id="breadShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#78350F" floodOpacity="0.35" />
            </filter>
          </defs>
          <g filter="url(#breadShadow)" transform="rotate(-15 60 35)">
            <ellipse cx="60" cy="35" rx="54" ry="14" fill="url(#baguetteGrad)" />
            {/* Crisp slash cuts */}
            <ellipse cx="30" cy="33" rx="7" ry="4" fill="url(#cutGrad)" transform="rotate(35 30 33)" />
            <ellipse cx="50" cy="34" rx="7" ry="4" fill="url(#cutGrad)" transform="rotate(35 50 34)" />
            <ellipse cx="70" cy="35" rx="7" ry="4" fill="url(#cutGrad)" transform="rotate(35 70 35)" />
            <ellipse cx="90" cy="36" rx="7" ry="4" fill="url(#cutGrad)" transform="rotate(35 90 36)" />
          </g>
        </svg>
      </div>
    );
  }

  // 2. Pain Amélioré
  if (n.includes('amélioré') || n.includes('ameliore') || id === 2) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 100 70" className="w-full h-full">
          <defs>
            <linearGradient id="loafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
          <g transform="translate(10, 10)">
            {/* Loaf slices / crown */}
            <rect x="5" y="15" width="70" height="35" rx="10" fill="url(#loafGrad)" />
            <circle cx="20" cy="18" r="14" fill="#D97706" />
            <circle cx="40" cy="16" r="15" fill="#F59E0B" />
            <circle cx="60" cy="18" r="14" fill="#D97706" />
            <ellipse cx="40" cy="40" rx="32" ry="7" fill="#FCD34D" opacity="0.6" />
            {/* Cut lines */}
            <path d="M 28 15 L 28 42 M 52 15 L 52 42" stroke="#78350F" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.5" />
          </g>
        </svg>
      </div>
    );
  }

  // 3. Œuf (1 pièce)
  if ((n.includes('œuf') || n.includes('oeuf')) && !n.includes('plateau') || id === 3) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="eggGrad" x1="20%" y1="15%" x2="80%" y2="85%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="30%" stopColor="#FDE68A" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id="eggHighlight" cx="35%" cy="30%" r="30%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform="translate(10, 5)">
            <ellipse cx="30" cy="35" rx="22" ry="29" fill="url(#eggGrad)" />
            <ellipse cx="26" cy="27" rx="12" ry="16" fill="url(#eggHighlight)" />
          </g>
        </svg>
      </div>
    );
  }

  // 4. Plateau Œufs
  if (n.includes('plateau') || id === 4) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 100 80" className="w-full h-full">
          <defs>
            <linearGradient id="trayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D1D5DB" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </linearGradient>
            <linearGradient id="miniEgg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>
          <polygon points="10,45 90,45 80,72 20,72" fill="url(#trayGrad)" stroke="#6B7280" strokeWidth="1" />
          <g>
            <ellipse cx="25" cy="40" rx="9" ry="12" fill="url(#miniEgg)" />
            <ellipse cx="42" cy="38" rx="9" ry="12" fill="url(#miniEgg)" />
            <ellipse cx="59" cy="38" rx="9" ry="12" fill="url(#miniEgg)" />
            <ellipse cx="76" cy="40" rx="9" ry="12" fill="url(#miniEgg)" />

            <ellipse cx="33" cy="28" rx="8" ry="11" fill="url(#miniEgg)" />
            <ellipse cx="50" cy="26" rx="8" ry="11" fill="url(#miniEgg)" />
            <ellipse cx="67" cy="28" rx="8" ry="11" fill="url(#miniEgg)" />

            <ellipse cx="42" cy="18" rx="7" ry="10" fill="url(#miniEgg)" />
            <ellipse cx="58" cy="18" rx="7" ry="10" fill="url(#miniEgg)" />
          </g>
        </svg>
      </div>
    );
  }

  // 5. Sachet Caisse
  if (n.includes('sachet caisse') || n.includes('sachet') && n.includes('plastique') || id === 5) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="kraftBag" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="40%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <g transform="translate(10, 5)">
            <path d="M 12 25 C 12 10, 48 10, 48 25" stroke="#92400E" strokeWidth="4" fill="none" strokeLinecap="round" />
            <polygon points="8,24 52,24 58,68 2,68" fill="url(#kraftBag)" />
            {/* Logo motif */}
            <circle cx="30" cy="45" r="9" fill="#FDE68A" opacity="0.8" />
            <path d="M 26 45 L 34 45 M 30 41 L 30 49" stroke="#92400E" strokeWidth="2" />
          </g>
        </svg>
      </div>
    );
  }

  // 6. Lait Sachet
  if (n.includes('lait') || id === 6) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="milkPouch" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>
          </defs>
          <g transform="translate(15, 6)">
            {/* Pouch shape */}
            <rect x="4" y="8" width="42" height="58" rx="8" fill="url(#milkPouch)" stroke="#38BDF8" strokeWidth="1.5" />
            {/* Blue Algerian brand wave & cow logo */}
            <path d="M 4 28 C 16 35, 34 22, 46 30 L 46 50 C 34 44, 16 54, 4 48 Z" fill="#0284C7" />
            <circle cx="25" cy="39" r="6" fill="#FFFFFF" />
            <text x="25" y="42" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#0284C7">حليب</text>
            <text x="25" y="60" fontSize="5" fontWeight="black" textAnchor="middle" fill="#0369A1">LAIT 1L</text>
          </g>
        </svg>
      </div>
    );
  }

  // 7. Eau 0.5L
  if (n.includes('eau') || id === 7) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 60 90" className="w-full h-full">
          <defs>
            <linearGradient id="waterBottle" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#BAE6FD" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#7DD3FC" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <g transform="translate(12, 5)">
            {/* Cap */}
            <rect x="13" y="2" width="10" height="6" rx="2" fill="#0284C7" />
            {/* Neck */}
            <path d="M 15 8 L 21 8 L 24 18 L 12 18 Z" fill="url(#waterBottle)" />
            {/* Body */}
            <rect x="9" y="18" width="18" height="58" rx="6" fill="url(#waterBottle)" />
            {/* Label */}
            <rect x="9" y="36" width="18" height="20" fill="#0EA5E9" />
            <path d="M 12 46 Q 18 42 24 46" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
          </g>
        </svg>
      </div>
    );
  }

  // 8. Croissant
  if (n.includes('croissant') || id === 8) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 90 70" className="w-full h-full">
          <defs>
            <linearGradient id="croissantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="35%" stopColor="#D97706" />
              <stop offset="70%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
          </defs>
          <g transform="translate(10, 10)">
            <path
              d="M 10 45 C 5 20, 25 5, 45 10 C 55 12, 65 20, 60 45 C 52 38, 48 30, 35 30 C 22 30, 18 38, 10 45 Z"
              fill="url(#croissantGrad)"
            />
            {/* Flaky folds */}
            <path d="M 28 14 C 33 22, 33 30, 31 36" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
            <path d="M 42 15 C 45 22, 45 30, 42 36" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    );
  }

  // 9. Zitoune Vert
  if (n.includes('zitoune vert') || n.includes('olive') && n.includes('vert') || id === 9) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="greenOlive" x1="20%" y1="20%" x2="80%" y2="80%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="40%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
          </defs>
          <g transform="translate(12, 8)">
            {/* Olive 1 */}
            <ellipse cx="24" cy="38" rx="16" ry="22" fill="url(#greenOlive)" transform="rotate(-15 24 38)" />
            <ellipse cx="20" cy="30" rx="5" ry="8" fill="#FFFFFF" opacity="0.4" transform="rotate(-15 20 30)" />
            <circle cx="27" cy="46" r="3" fill="#EF4444" /> {/* Pimento red center */}

            {/* Olive 2 */}
            <ellipse cx="42" cy="44" rx="14" ry="19" fill="url(#greenOlive)" transform="rotate(25 42 44)" />
            <ellipse cx="40" cy="38" rx="4" ry="7" fill="#FFFFFF" opacity="0.4" transform="rotate(25 40 38)" />
            <circle cx="45" cy="51" r="2.5" fill="#EF4444" />
          </g>
        </svg>
      </div>
    );
  }

  // 10. Zitoune Noir
  if (n.includes('zitoune noir') || n.includes('olive') && n.includes('noir') || id === 10) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="blackOlive" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="25%" stopColor="#334155" />
              <stop offset="70%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <g transform="translate(12, 8)">
            <ellipse cx="24" cy="40" rx="15" ry="21" fill="url(#blackOlive)" transform="rotate(-10 24 40)" />
            <ellipse cx="20" cy="32" rx="5" ry="8" fill="#FFFFFF" opacity="0.5" transform="rotate(-10 20 32)" />

            <ellipse cx="42" cy="42" rx="14" ry="19" fill="url(#blackOlive)" transform="rotate(20 42 42)" />
            <ellipse cx="40" cy="35" rx="4" ry="7" fill="#FFFFFF" opacity="0.5" transform="rotate(20 40 35)" />
          </g>
        </svg>
      </div>
    );
  }

  // 11. Gruiére / Gruyère / Fromage
  if (n.includes('grui') || n.includes('gruy') || n.includes('fromage') || n.includes('cheese') || id === 11) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 90 75" className="w-full h-full">
          <defs>
            <linearGradient id="cheeseTop" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
            <linearGradient id="cheeseSide" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="cheeseCrust" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>
            <radialGradient id="holeGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#B45309" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FDE047" />
            </radialGradient>
          </defs>
          <g transform="translate(6, 6)">
            {/* Croûte arrière */}
            <path d="M 10 18 C 25 8, 55 8, 70 20 L 70 42 C 55 32, 25 32, 10 40 Z" fill="url(#cheeseCrust)" />
            {/* Face avant / Tranche de gruyère 3D */}
            <polygon points="10,18 70,20 40,62" fill="url(#cheeseTop)" />
            {/* Flanc droit du triangle */}
            <polygon points="70,20 70,42 40,62" fill="url(#cheeseSide)" opacity="0.95" />
            {/* Flanc gauche */}
            <polygon points="10,18 10,40 40,62" fill="url(#cheeseSide)" />

            {/* Trous de gruyère avec relief */}
            <ellipse cx="36" cy="34" rx="7" ry="4" fill="url(#holeGrad)" transform="rotate(-10 36 34)" />
            <ellipse cx="35" cy="33" rx="2" ry="1" fill="#FEF9C3" opacity="0.8" />
            
            <ellipse cx="52" cy="28" rx="5" ry="3" fill="url(#holeGrad)" transform="rotate(15 52 28)" />
            <ellipse cx="34" cy="48" rx="4" ry="2.5" fill="url(#holeGrad)" />
            <ellipse cx="20" cy="44" rx="3.5" ry="4" fill="#92400E" />
          </g>
        </svg>
      </div>
    );
  }

  // 11-bis. Jus d'Orange
  if (n.includes('jus') || n.includes('orange')) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 60 90" className="w-full h-full">
          <defs>
            <linearGradient id="juiceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <g transform="translate(12, 5)">
            {/* Cap */}
            <rect x="13" y="3" width="10" height="6" rx="2" fill="#15803D" />
            {/* Bottle */}
            <path d="M 15 9 L 21 9 L 25 22 L 11 22 Z" fill="#FED7AA" opacity="0.7" />
            <rect x="8" y="22" width="20" height="54" rx="7" fill="url(#juiceGrad)" />
            {/* Orange slice icon on bottle */}
            <circle cx="18" cy="48" r="6" fill="#FDE047" stroke="#EA580C" strokeWidth="1" />
          </g>
        </svg>
      </div>
    );
  }

  // 12. Yaourt Soummam
  if (n.includes('yaourt') || n.includes('soummam') || id === 12) {
    return (
      <div className={`relative flex items-center justify-center ${className} drop-shadow-md`}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="yogurtCup" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="40%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          <g transform="translate(12, 10)">
            {/* Lid */}
            <ellipse cx="28" cy="18" rx="26" ry="6" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
            <ellipse cx="28" cy="18" rx="22" ry="4" fill="#E2E8F0" />
            {/* Pot */}
            <polygon points="4,19 52,19 44,56 12,56" fill="url(#yogurtCup)" />
            {/* Logo */}
            <ellipse cx="28" cy="38" rx="12" ry="7" fill="#FFFFFF" />
            <text x="28" y="40" fontSize="5" fontWeight="black" textAnchor="middle" fill="#0369A1">SOUMMAM</text>
          </g>
        </svg>
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`flex items-center justify-center text-3xl ${className}`}>
      📦
    </div>
  );
}
