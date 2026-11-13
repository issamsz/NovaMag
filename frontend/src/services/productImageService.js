/**
 * Service de génération d'images haute qualité pour les articles du catalogue
 * Génère des illustrations vectorielles réalistes et colorées pour chaque type de produit :
 * - Olives (vertes et noires)
 * - Produits laitiers (lait, yaourt, fromage, beurre)
 * - Boulangerie (baguette, pain, croissant, brioche)
 * - Boissons (eaux, jus, sodas Sélecto / Hamoud)
 * - Fruits & Légumes (pommes, bananes, etc.)
 * - Épicerie & Pâtes (farine Safina, pâtes Sim, huile Afia)
 * - Produits d'entretien (nettoyage, anti crash)
 * - Œufs et sachets de caisse
 */

export function getProductVisualData(name = '', category = '') {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Olives Noires (Zitoune Noir)
  if ((n.includes('olive') || n.includes('zitoun')) && n.includes('noir')) {
    return {
      emoji: '🫒',
      bgGrad1: '#1E293B',
      bgGrad2: '#0F172A',
      cardBg1: '#F1F5F9',
      cardBg2: '#E2E8F0',
      badgeBg: '#334155',
      badgeText: '#F8FAFC',
      label: 'Olives Noires',
      iconSvg: `
        <ellipse cx="140" cy="155" rx="34" ry="46" fill="#0F172A" transform="rotate(-15 140 155)" />
        <ellipse cx="132" cy="140" rx="10" ry="18" fill="#94A3B8" opacity="0.45" transform="rotate(-15 132 140)" />
        <ellipse cx="185" cy="165" rx="30" ry="42" fill="#1E293B" transform="rotate(22 185 165)" />
        <ellipse cx="180" cy="150" rx="8" ry="15" fill="#CBD5E1" opacity="0.4" transform="rotate(22 180 150)" />
      `
    };
  }

  // 2. Olives Vertes (Zitoune Vert)
  if (n.includes('olive') || n.includes('zitoun')) {
    return {
      emoji: '🫒',
      bgGrad1: '#059669',
      bgGrad2: '#047857',
      cardBg1: '#ECFDF5',
      cardBg2: '#D1FAE5',
      badgeBg: '#059669',
      badgeText: '#FFFFFF',
      label: 'Olives Vertes',
      iconSvg: `
        <ellipse cx="138" cy="155" rx="34" ry="46" fill="#10B981" transform="rotate(-15 138 155)" />
        <ellipse cx="130" cy="140" rx="10" ry="18" fill="#A7F3D0" opacity="0.6" transform="rotate(-15 130 140)" />
        <circle cx="146" cy="170" r="7" fill="#EF4444" />
        <ellipse cx="185" cy="165" rx="30" ry="42" fill="#059669" transform="rotate(20 185 165)" />
        <ellipse cx="180" cy="150" rx="8" ry="15" fill="#D1FAE5" opacity="0.5" transform="rotate(20 180 150)" />
        <circle cx="192" cy="180" r="6" fill="#EF4444" />
      `
    };
  }

  // 2-bis. Chema / Tabac (ex: Chema Afrika)
  if (n.includes('chema') || n.includes('chamma') || n.includes('tabac') || n.includes('afrika')) {
    return {
      emoji: '🌿',
      bgGrad1: '#065F46',
      bgGrad2: '#047857',
      cardBg1: '#ECFDF5',
      cardBg2: '#D1FAE5',
      badgeBg: '#065F46',
      badgeText: '#FFFFFF',
      label: 'Chema Afrika'
    };
  }

  // 3. Croissant / Brioche au Beurre
  if (n.includes('croissant') || n.includes('brioche') || n.includes('viennoiserie')) {
    return {
      emoji: '🥐',
      bgGrad1: '#F59E0B',
      bgGrad2: '#D97706',
      cardBg1: '#FFFBEB',
      cardBg2: '#FEF3C7',
      badgeBg: '#D97706',
      badgeText: '#FFFFFF',
      label: 'Croissant au Beurre',
      iconSvg: `
        <path d="M 100 190 C 85 140, 130 100, 160 110 C 180 115, 205 135, 195 190 C 180 175, 170 160, 145 160 C 125 160, 115 175, 100 190 Z" fill="#D97706" />
        <path d="M 125 120 C 140 145, 140 165, 135 178" stroke="#FDE68A" stroke-width="5" stroke-linecap="round" />
        <path d="M 160 122 C 170 145, 170 165, 165 178" stroke="#FDE68A" stroke-width="5" stroke-linecap="round" />
      `
    };
  }

  // 4. Pain Baguette Ordinaire
  if (n.includes('baguette') || (n.includes('pain') && n.includes('ordinaire'))) {
    return {
      emoji: '🥖',
      bgGrad1: '#F59E0B',
      bgGrad2: '#B45309',
      cardBg1: '#FFFBEB',
      cardBg2: '#FDE68A',
      badgeBg: '#B45309',
      badgeText: '#FFFFFF',
      label: 'Baguette Chaude',
      iconSvg: `
        <g transform="rotate(-20 160 160)">
          <ellipse cx="160" cy="160" rx="100" ry="26" fill="#D97706" />
          <ellipse cx="110" cy="155" rx="14" ry="7" fill="#FEF3C7" transform="rotate(35 110 155)" />
          <ellipse cx="145" cy="158" rx="14" ry="7" fill="#FEF3C7" transform="rotate(35 145 158)" />
          <ellipse cx="180" cy="161" rx="14" ry="7" fill="#FEF3C7" transform="rotate(35 180 161)" />
          <ellipse cx="215" cy="164" rx="14" ry="7" fill="#FEF3C7" transform="rotate(35 215 164)" />
        </g>
      `
    };
  }

  // 5. Pain Traditionnel Amélioré
  if (n.includes('pain') || n.includes('boulangerie')) {
    return {
      emoji: '🍞',
      bgGrad1: '#D97706',
      bgGrad2: '#92400E',
      cardBg1: '#FFFBEB',
      cardBg2: '#FEF3C7',
      badgeBg: '#92400E',
      badgeText: '#FFFFFF',
      label: 'Pain Traditionnel',
      iconSvg: `
        <rect x="100" y="130" width="120" height="65" rx="20" fill="#B45309" />
        <circle cx="125" cy="130" r="26" fill="#D97706" />
        <circle cx="160" cy="125" r="28" fill="#F59E0B" />
        <circle cx="195" cy="130" r="26" fill="#D97706" />
        <ellipse cx="160" cy="175" rx="55" ry="12" fill="#FDE68A" opacity="0.5" />
      `
    };
  }

  // 6. Anti crash / Produits d'Entretien & Nettoyage
  if (n.includes('crash') || n.includes('nettoy') || n.includes('entretien') || n.includes('javel') || n.includes('lessive') || c.includes('nettoy')) {
    return {
      emoji: '🧼',
      bgGrad1: '#2563EB',
      bgGrad2: '#1D4ED8',
      cardBg1: '#EFF6FF',
      cardBg2: '#DBEAFE',
      badgeBg: '#1D4ED8',
      badgeText: '#FFFFFF',
      label: 'Nettoyant & Entretien',
      iconSvg: `
        <rect x="135" y="105" width="50" height="25" rx="6" fill="#3B82F6" />
        <rect x="150" y="90" width="20" height="18" fill="#1D4ED8" />
        <path d="M 125 130 L 195 130 L 205 215 L 115 215 Z" fill="#2563EB" />
        <rect x="125" y="150" width="70" height="35" rx="6" fill="#FFFFFF" opacity="0.9" />
        <text x="160" y="172" font-size="12" font-weight="900" text-anchor="middle" fill="#1E40AF">CLEAN</text>
        <circle cx="135" cy="125" r="5" fill="#93C5FD" />
        <circle cx="185" cy="120" r="4" fill="#93C5FD" />
      `
    };
  }

  // 7. Bouteille d'Eau Minérale 0.5L / 1.5L
  if (n.includes('eau') || n.includes('minérale') || n.includes('saida') || n.includes('ifri') || n.includes('lalla')) {
    return {
      emoji: '💧',
      bgGrad1: '#0284C7',
      bgGrad2: '#0369A1',
      cardBg1: '#F0F9FF',
      cardBg2: '#BAE6FD',
      badgeBg: '#0284C7',
      badgeText: '#FFFFFF',
      label: 'Eau Minérale',
      iconSvg: `
        <rect x="150" y="95" width="20" height="12" rx="3" fill="#0284C7" />
        <path d="M 152 107 L 168 107 L 175 130 L 145 130 Z" fill="#7DD3FC" opacity="0.8" />
        <rect x="140" y="130" width="40" height="85" rx="10" fill="#38BDF8" opacity="0.85" />
        <rect x="140" y="155" width="40" height="30" fill="#0EA5E9" />
        <path d="M 145 170 Q 160 162 175 170" stroke="#FFFFFF" stroke-width="3" fill="none" />
      `
    };
  }

  // 8. Lait Pasteurisé en Sachet 1L
  if (n.includes('lait') && (n.includes('sachet') || n.includes('pasteurisé') || n.includes('pasteurise'))) {
    return {
      emoji: '🥛',
      bgGrad1: '#0284C7',
      bgGrad2: '#075985',
      cardBg1: '#F0F9FF',
      cardBg2: '#E0F2FE',
      badgeBg: '#0284C7',
      badgeText: '#FFFFFF',
      label: 'Lait en Sachet 1L',
      iconSvg: `
        <rect x="125" y="105" width="70" height="105" rx="14" fill="#FFFFFF" stroke="#38BDF8" stroke-width="3" />
        <path d="M 125 140 C 145 155, 175 130, 195 145 L 195 180 C 175 168, 145 188, 125 175 Z" fill="#0284C7" />
        <text x="160" y="162" font-size="11" font-weight="900" text-anchor="middle" fill="#FFFFFF">حليب 1L</text>
      `
    };
  }

  // 9. Lait Candia Viva / Candilait Brique 1L
  if (n.includes('lait') || n.includes('candia')) {
    return {
      emoji: '🥛',
      bgGrad1: '#DC2626',
      bgGrad2: '#991B1B',
      cardBg1: '#FEF2F2',
      cardBg2: '#FEE2E2',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF',
      label: 'Lait Candia 1L',
      iconSvg: `
        <rect x="130" y="100" width="60" height="110" rx="8" fill="#FFFFFF" stroke="#DC2626" stroke-width="3" />
        <rect x="130" y="130" width="60" height="40" fill="#DC2626" />
        <text x="160" y="155" font-size="11" font-weight="900" text-anchor="middle" fill="#FFFFFF">CANDIA</text>
      `
    };
  }

  // 10. Sachet Plastique de Caisse
  if (n.includes('sachet') && (n.includes('caisse') || n.includes('plastique'))) {
    return {
      emoji: '🛍️',
      bgGrad1: '#64748B',
      bgGrad2: '#475569',
      cardBg1: '#F8FAFC',
      cardBg2: '#E2E8F0',
      badgeBg: '#475569',
      badgeText: '#FFFFFF',
      label: 'Sachet de Caisse',
      iconSvg: `
        <path d="M 135 125 C 135 105, 185 105, 185 125" stroke="#78350F" stroke-width="6" fill="none" stroke-linecap="round" />
        <polygon points="125,125 195,125 205,210 115,210" fill="#B45309" />
        <circle cx="160" cy="165" r="14" fill="#FDE68A" opacity="0.85" />
        <path d="M 152 165 L 168 165 M 160 157 L 160 173" stroke="#78350F" stroke-width="3" />
      `
    };
  }

  // 11. Plateau d'Œufs (30 pièces)
  if (n.includes('plateau') || (n.includes('oeuf') && n.includes('30')) || (n.includes('œuf') && n.includes('30'))) {
    return {
      emoji: '🥚',
      bgGrad1: '#EAB308',
      bgGrad2: '#CA8A04',
      cardBg1: '#FEFCE8',
      cardBg2: '#FEF9C3',
      badgeBg: '#CA8A04',
      badgeText: '#FFFFFF',
      label: 'Plateau Œufs (30)',
      iconSvg: `
        <polygon points="110,170 210,170 195,205 125,205" fill="#9CA3AF" />
        <ellipse cx="130" cy="160" rx="12" ry="16" fill="#FDE68A" />
        <ellipse cx="150" cy="158" rx="12" ry="16" fill="#F59E0B" />
        <ellipse cx="170" cy="158" rx="12" ry="16" fill="#FDE68A" />
        <ellipse cx="190" cy="160" rx="12" ry="16" fill="#F59E0B" />
        <ellipse cx="140" cy="142" rx="11" ry="15" fill="#FEF3C7" />
        <ellipse cx="160" cy="140" rx="11" ry="15" fill="#FDE68A" />
        <ellipse cx="180" cy="142" rx="11" ry="15" fill="#FEF3C7" />
      `
    };
  }

  // 12. Œuf Frais Fermier (Unité)
  if (n.includes('oeuf') || n.includes('œuf')) {
    return {
      emoji: '🥚',
      bgGrad1: '#F59E0B',
      bgGrad2: '#D97706',
      cardBg1: '#FEFCE8',
      cardBg2: '#FEF3C7',
      badgeBg: '#D97706',
      badgeText: '#FFFFFF',
      label: 'Œuf Frais',
      iconSvg: `
        <ellipse cx="160" cy="155" rx="36" ry="48" fill="#FDE68A" />
        <ellipse cx="150" cy="140" rx="16" ry="24" fill="#FFFFFF" opacity="0.6" />
      `
    };
  }

  // 13. Fromage Gruyère Local & Fromage Cheddar
  if (n.includes('gruy') || n.includes('grui') || n.includes('cheddar') || n.includes('fromage')) {
    return {
      emoji: '🧀',
      bgGrad1: '#F59E0B',
      bgGrad2: '#B45309',
      cardBg1: '#FEFCE8',
      cardBg2: '#FEF08A',
      badgeBg: '#B45309',
      badgeText: '#FFFFFF',
      label: n.includes('cheddar') ? 'Fromage Cheddar' : 'Gruyère au Poids',
      iconSvg: `
        <polygon points="115,135 205,138 160,195" fill="#FACC15" />
        <polygon points="205,138 205,170 160,195" fill="#EAB308" />
        <polygon points="115,135 115,168 160,195" fill="#F59E0B" />
        <circle cx="150" cy="155" r="7" fill="#B45309" opacity="0.75" />
        <circle cx="175" cy="150" r="5" fill="#B45309" opacity="0.7" />
        <circle cx="145" cy="175" r="5" fill="#B45309" opacity="0.7" />
      `
    };
  }

  // 14. Yaourt Soummam aux Fruits
  if (n.includes('yaourt') || n.includes('soummam') || n.includes('danone')) {
    return {
      emoji: '🥣',
      bgGrad1: '#0284C7',
      bgGrad2: '#0369A1',
      cardBg1: '#F0FDF4',
      cardBg2: '#DCFCE7',
      badgeBg: '#0284C7',
      badgeText: '#FFFFFF',
      label: 'Yaourt Soummam',
      iconSvg: `
        <ellipse cx="160" cy="120" rx="42" ry="10" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2" />
        <polygon points="120,122 200,122 188,185 132,185" fill="#0284C7" />
        <ellipse cx="160" cy="155" rx="20" ry="12" fill="#FFFFFF" />
        <text x="160" y="159" font-size="7" font-weight="900" text-anchor="middle" fill="#0284C7">SOUMMAM</text>
      `
    };
  }

  // 15. Boisson Gazeuse Hamoud Boualem Sélecto
  if (n.includes('hamoud') || n.includes('selecto') || n.includes('sélecto') || n.includes('soda')) {
    return {
      emoji: '🥤',
      bgGrad1: '#991B1B',
      bgGrad2: '#7F1D1D',
      cardBg1: '#FEF2F2',
      cardBg2: '#FEE2E2',
      badgeBg: '#991B1B',
      badgeText: '#FFFFFF',
      label: 'Sélecto Hamoud',
      iconSvg: `
        <rect x="150" y="95" width="20" height="12" rx="3" fill="#EAB308" />
        <path d="M 152 107 L 168 107 L 175 130 L 145 130 Z" fill="#78350F" />
        <rect x="140" y="130" width="40" height="85" rx="10" fill="#451A03" />
        <rect x="140" y="155" width="40" height="30" fill="#DC2626" />
        <text x="160" y="174" font-size="8" font-weight="900" text-anchor="middle" fill="#FFFFFF">SELECTO</text>
      `
    };
  }

  // 16. Jus Ramy Orange
  if (n.includes('jus') || n.includes('ramy') || n.includes('orange')) {
    return {
      emoji: '🍊',
      bgGrad1: '#EA580C',
      bgGrad2: '#C2410C',
      cardBg1: '#FFF7ED',
      cardBg2: '#FFEDD5',
      badgeBg: '#EA580C',
      badgeText: '#FFFFFF',
      label: 'Jus Ramy Orange',
      iconSvg: `
        <rect x="150" y="95" width="20" height="12" rx="3" fill="#15803D" />
        <path d="M 152 107 L 168 107 L 175 130 L 145 130 Z" fill="#FED7AA" />
        <rect x="140" y="130" width="40" height="85" rx="10" fill="#F97316" />
        <circle cx="160" cy="170" r="12" fill="#FDE047" stroke="#EA580C" stroke-width="2" />
      `
    };
  }

  // 17. Farine Supérieure Safina 1kg
  if (n.includes('farine') || n.includes('safina')) {
    return {
      emoji: '🌾',
      bgGrad1: '#0284C7',
      bgGrad2: '#0369A1',
      cardBg1: '#F0F9FF',
      cardBg2: '#E0F2FE',
      badgeBg: '#0284C7',
      badgeText: '#FFFFFF',
      label: 'Farine Safina 1kg',
      iconSvg: `
        <rect x="125" y="105" width="70" height="105" rx="10" fill="#FFFFFF" stroke="#0284C7" stroke-width="3" />
        <rect x="125" y="135" width="70" height="40" fill="#0284C7" />
        <text x="160" y="160" font-size="10" font-weight="900" text-anchor="middle" fill="#FFFFFF">SAFINA</text>
      `
    };
  }

  // 18. Pâtes Sim Spaghetti
  if (n.includes('pâte') || n.includes('pates') || n.includes('spaghetti') || n.includes('sim')) {
    return {
      emoji: '🍝',
      bgGrad1: '#DC2626',
      bgGrad2: '#991B1B',
      cardBg1: '#FEF2F2',
      cardBg2: '#FEE2E2',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF',
      label: 'Pâtes Sim Spaghetti',
      iconSvg: `
        <rect x="135" y="95" width="50" height="125" rx="8" fill="#DC2626" stroke="#FEF08A" stroke-width="3" />
        <text x="160" y="160" font-size="12" font-weight="900" text-anchor="middle" fill="#FEF08A">SIM</text>
      `
    };
  }

  // 19. Huile de Table Afia 5L
  if (n.includes('huile') || n.includes('afia') || n.includes('cevital')) {
    return {
      emoji: '🌻',
      bgGrad1: '#CA8A04',
      bgGrad2: '#A16207',
      cardBg1: '#FEFCE8',
      cardBg2: '#FEF08A',
      badgeBg: '#CA8A04',
      badgeText: '#FFFFFF',
      label: 'Huile Afia 5L',
      iconSvg: `
        <rect x="145" y="95" width="30" height="15" rx="4" fill="#DC2626" />
        <rect x="125" y="115" width="70" height="95" rx="16" fill="#FACC15" />
        <circle cx="160" cy="162" r="15" fill="#FFFFFF" />
        <text x="160" y="166" font-size="9" font-weight="900" text-anchor="middle" fill="#CA8A04">AFIA</text>
      `
    };
  }

  // 20. Viande Bovine Fraîche Hachée
  if (n.includes('viande') || n.includes('bœuf') || n.includes('boeuf') || n.includes('haché') || c.includes('boucherie')) {
    return {
      emoji: '🥩',
      bgGrad1: '#B91C1C',
      bgGrad2: '#7F1D1D',
      cardBg1: '#FEF2F2',
      cardBg2: '#FEE2E2',
      badgeBg: '#B91C1C',
      badgeText: '#FFFFFF',
      label: 'Viande Bovine (kg)',
      iconSvg: `
        <ellipse cx="160" cy="160" rx="48" ry="32" fill="#DC2626" transform="rotate(-10 160 160)" />
        <path d="M 130 150 C 145 145, 175 145, 190 155" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.6" />
        <ellipse cx="135" cy="165" rx="8" ry="6" fill="#FFFFFF" opacity="0.75" />
      `
    };
  }

  // 21. Bananes Fraîches d'Importation
  if (n.includes('banane')) {
    return {
      emoji: '🍌',
      bgGrad1: '#EAB308',
      bgGrad2: '#CA8A04',
      cardBg1: '#FEFCE8',
      cardBg2: '#FEF9C3',
      badgeBg: '#CA8A04',
      badgeText: '#FFFFFF',
      label: 'Bananes Fraîches',
      iconSvg: `
        <path d="M 125 180 C 135 130, 180 120, 205 130 C 190 145, 155 155, 135 190 Z" fill="#FACC15" />
        <path d="M 125 180 L 120 188" stroke="#713F12" stroke-width="4" stroke-linecap="round" />
      `
    };
  }

  // 22. Pommes Rouges Locales
  if (n.includes('pomme') && !n.includes('terre')) {
    return {
      emoji: '🍎',
      bgGrad1: '#DC2626',
      bgGrad2: '#991B1B',
      cardBg1: '#FEF2F2',
      cardBg2: '#FEE2E2',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF',
      label: 'Pommes Rouges',
      iconSvg: `
        <ellipse cx="145" cy="160" rx="28" ry="32" fill="#DC2626" />
        <ellipse cx="175" cy="160" rx="28" ry="32" fill="#B91C1C" />
        <path d="M 160 130 Q 165 118 160 110" stroke="#713F12" stroke-width="4" fill="none" />
        <ellipse cx="170" cy="118" rx="8" ry="4" fill="#16A34A" transform="rotate(-30 170 118)" />
      `
    };
  }

  // 23. Matériel Informatique & Accessoires
  if (n.includes('pc') || n.includes('ordinateur') || n.includes('dell') || n.includes('vostro')) {
    return { emoji: '💻', bgGrad1: '#2563EB', bgGrad2: '#1D4ED8', cardBg1: '#F1F5F9', cardBg2: '#E2E8F0', badgeBg: '#2563EB', badgeText: '#FFFFFF', label: 'PC Portable' };
  }
  if (n.includes('souris') || n.includes('clavier')) {
    return { emoji: '⌨️', bgGrad1: '#4F46E5', bgGrad2: '#3730A3', cardBg1: '#F1F5F9', cardBg2: '#E2E8F0', badgeBg: '#4F46E5', badgeText: '#FFFFFF', label: 'Périphérique' };
  }
  if (n.includes('pack')) {
    return { emoji: '🎁', bgGrad1: '#9333EA', bgGrad2: '#7E22CE', cardBg1: '#FAF5FF', cardBg2: '#F3E8FF', badgeBg: '#9333EA', badgeText: '#FFFFFF', label: 'Pack Promo' };
  }

  // Fallback général intelligent
  return {
    emoji: '🏷️',
    bgGrad1: '#0284C7',
    bgGrad2: '#0369A1',
    cardBg1: '#F8FAFC',
    cardBg2: '#F1F5F9',
    badgeBg: '#0284C7',
    badgeText: '#FFFFFF',
    label: name ? name.slice(0, 18) : 'Produit'
  };
}

/**
 * Génère une URL Data URI d'image SVG haute définition colorée et appétissante
 * Fini les ronds gris avec lettres tristes !
 */
export function getDefaultProductImage(product = {}) {
  const name = typeof product === 'string' ? product : (product.name || 'Produit');
  const category = typeof product === 'object' ? (product.category || product.category_name || '') : '';
  const data = getProductVisualData(name, category);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
    <defs>
      <linearGradient id="cardBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${data.cardBg1}" />
        <stop offset="100%" stop-color="${data.cardBg2}" />
      </linearGradient>
      <radialGradient id="glowCircle" cx="50%" cy="48%" r="48%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.3" />
      </radialGradient>
      <filter id="softShadow" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.12" />
      </filter>
    </defs>

    <!-- Fond carte doux arrondi -->
    <rect width="320" height="320" rx="32" fill="url(#cardBgGrad)" />

    <!-- Cercle central en relief lumineux -->
    <circle cx="160" cy="155" r="92" fill="url(#glowCircle)" filter="url(#softShadow)" />

    <!-- Dessin SVG dédié si présent OU Emoji réaliste grand format -->
    ${data.iconSvg ? `
      <g filter="url(#softShadow)">
        ${data.iconSvg}
      </g>
    ` : `
      <text x="160" y="175" font-size="88" text-anchor="middle" dominant-baseline="central">
        ${data.emoji}
      </text>
    `}

    <!-- Petit badge moderne en bas avec le nom élégant du type de produit -->
    <g transform="translate(160, 275)">
      <rect x="-85" y="-14" width="170" height="28" rx="14" fill="${data.badgeBg}" opacity="0.95" />
      <text x="0" y="4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="11.5" font-weight="900" fill="${data.badgeText}" text-anchor="middle">
        ${data.label}
      </text>
    </g>
  </svg>`;

  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

