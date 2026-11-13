// =========================================================================
// GESTION RÉELLE ET DYNAMIQUE DES RÔLES & PERMISSIONS (RBAC) - NovaMag
// =========================================================================

export const ROLE_DEFINITIONS = {
  admin: {
    id: 'admin',
    name: 'Administrateur (Accès Complet)',
    badgeName: 'Admin',
    badgeClass: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    description: "Accès total et illimité à l'ensemble du système, aux rapports confidentiels et aux paramètres.",
    allowedViews: [
      'dashboard',
      'pos',
      'products',
      'barcodes',
      'inventory',
      'promotions',
      'packs',
      'suppliers',
      'purchases',
      'customers',
      'users',
      'proforma',
      'order_forms',
      'reports',
      'settings',
      'cash_drawer',
      'sales_history',
      'nova_ia',
      'ocr_invoice',
      'mobile_companion'
    ],
    canAddClientInPOS: true,
    canModifyPrices: true,
    canDeleteItems: true,
    canManageUsers: true,
    canAccessSettings: true
  },
  vendeur: {
    id: 'vendeur',
    name: 'Vendeur (Caisse uniquement)',
    badgeName: 'Vendeur',
    badgeClass: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    description: 'Accès au point de vente et à la caisse uniquement. Ne peut pas ajouter de nouveau client depuis le point de vente.',
    allowedViews: ['dashboard', 'pos', 'sales_history', 'cash_drawer'],
    canAddClientInPOS: false, // Règle stricte : Ne peut pas ajouter de nouveau client depuis la caisse
    canModifyPrices: false,
    canDeleteItems: true,
    canManageUsers: false,
    canAccessSettings: false
  },
  caissier: {
    id: 'caissier',
    name: 'Caissier (Caisse Uniquement)',
    badgeName: 'Caissier',
    badgeClass: 'bg-sky-100/90 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    description: "Accès au point de vente et à l'encaissement de la caisse uniquement.",
    allowedViews: ['dashboard', 'pos', 'sales_history', 'cash_drawer'],
    canAddClientInPOS: true,
    canModifyPrices: false,
    canDeleteItems: true,
    canManageUsers: false,
    canAccessSettings: false
  },
  comptable: {
    id: 'comptable',
    name: 'Comptable (Financier + Fournisseurs + Achats)',
    badgeName: 'Comptable',
    badgeClass: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    description: "Accès aux rapports financiers, à la gestion de caisse, aux factures d'achats et aux fournisseurs.",
    allowedViews: [
      'dashboard',
      'suppliers',
      'purchases',
      'customers',
      'proforma',
      'order_forms',
      'reports',
      'cash_drawer',
      'sales_history',
      'nova_ia',
      'ocr_invoice',
      'mobile_companion'
    ],
    canAddClientInPOS: false,
    canModifyPrices: false,
    canDeleteItems: false,
    canManageUsers: false,
    canAccessSettings: false
  },
  assistant: {
    id: 'assistant',
    name: 'Assistant (Tout sauf Paramètres)',
    badgeName: 'Assistant',
    badgeClass: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    description: 'Accès à toutes les fonctionnalités opérationnelles (ventes, achats, stocks, clients) sauf la configuration et les paramètres système.',
    allowedViews: [
      'dashboard',
      'pos',
      'products',
      'barcodes',
      'inventory',
      'promotions',
      'packs',
      'suppliers',
      'purchases',
      'customers',
      'proforma',
      'order_forms',
      'reports',
      'cash_drawer',
      'sales_history',
      'nova_ia',
      'ocr_invoice',
      'mobile_companion'
    ],
    canAddClientInPOS: true,
    canModifyPrices: true,
    canDeleteItems: true,
    canManageUsers: false,
    canAccessSettings: false
  }
};

/**
 * Récupère la définition du rôle actif
 */
export function getRoleDefinition(roleId) {
  return ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.admin;
}

/**
 * Vérifie si l'utilisateur a accès à une vue spécifique
 */
export function canAccessView(user, viewId) {
  if (!user) return true;
  const role = user.role || 'admin';
  const def = getRoleDefinition(role);
  return def.allowedViews.includes(viewId);
}

/**
 * Vérifie si le vendeur/caissier a l'autorisation d'ajouter un client depuis la caisse
 */
export function canAddClientInPOS(user) {
  if (!user) return true;
  const role = user.role || 'admin';
  const def = getRoleDefinition(role);
  return def.canAddClientInPOS;
}
