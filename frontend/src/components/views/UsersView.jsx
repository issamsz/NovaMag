import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCog,
  Lock,
  Edit2,
  Trash2,
  X,
  KeyRound,
  User,
  Contact,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import ModernToast from '../common/ModernToast';
import ConfirmDialog from '../common/ConfirmDialog';
import { useLanguage } from '../../i18n/LanguageContext';
import { getUsers, createUser, updateUser, deleteUser, getStoredUser } from '../../services/api';

// Liste exacte des 5 rôles avec libellés, badges et descriptions (Image 4c02e58e.png)
const ROLES = [
  {
    id: 'vendeur',
    name: 'Vendeur (Caisse uniquement)',
    badgeName: 'Vendeur',
    badgeClass: 'bg-blue-100/90 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    description: 'Accès au point de vente et à la caisse uniquement. Ne peut pas ajouter de nouveau client depuis le point de vente.'
  },
  {
    id: 'caissier',
    name: 'Caissier (Caisse Uniquement)',
    badgeName: 'Caissier',
    badgeClass: 'bg-sky-100/90 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300',
    description: "Accès au point de vente et à l'encaissement de la caisse uniquement."
  },
  {
    id: 'comptable',
    name: 'Comptable (Financier + Fournisseurs + Achats)',
    badgeName: 'Comptable',
    badgeClass: 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    description: "Accès aux rapports financiers, à la gestion de caisse, aux factures d'achats et aux fournisseurs."
  },
  {
    id: 'assistant',
    name: 'Assistant (Tout sauf Paramètres)',
    badgeName: 'Assistant',
    badgeClass: 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    description: 'Accès à toutes les fonctionnalités opérationnelles (ventes, achats, stocks, clients) sauf la configuration et les paramètres système.'
  },
  {
    id: 'admin',
    name: 'Administrateur (Accès Complet)',
    badgeName: 'Admin',
    badgeClass: 'bg-purple-100/90 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300',
    description: "Accès total et illimité à l'ensemble du système, aux rapports confidentiels et aux paramètres."
  }
];

const DEFAULT_USERS = [
  {
    id: 1,
    full_name: 'BZ Technology',
    username: 'admin',
    role: 'admin',
    is_active: 1
  }
];

// Fonction utilitaire de déduplication par nom d'utilisateur unique
const deduplicateUsers = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter((u) => {
    const key = String(u.username || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function UsersView({ onNavigate }) {
  const { language, isRTL, t } = useLanguage();
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('novamag_users');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_USERS;
      const clean = deduplicateUsers(parsed);
      localStorage.setItem('novamag_users', JSON.stringify(clean));
      return clean;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = getStoredUser();
      return stored || { id: 1, username: 'admin', full_name: 'BZ Technology', role: 'admin' };
    } catch {
      return { id: 1, username: 'admin', full_name: 'BZ Technology', role: 'admin' };
    }
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modale d'ajout / modification (Images 2 & 4c02e58e.png)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire modale
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'vendeur',
    is_active: 1
  });

  // Dialogue de confirmation de suppression
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Chargement des utilisateurs (API + synchronisation locale avec déduplication)
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const cleanList = deduplicateUsers(res.data);
        setUsers(cleanList);
        localStorage.setItem('novamag_users', JSON.stringify(cleanList));
      } else {
        const saved = localStorage.getItem('novamag_users');
        if (saved) {
          const cleanList = deduplicateUsers(JSON.parse(saved));
          setUsers(cleanList);
          localStorage.setItem('novamag_users', JSON.stringify(cleanList));
        } else {
          setUsers(DEFAULT_USERS);
          localStorage.setItem('novamag_users', JSON.stringify(DEFAULT_USERS));
        }
      }
    } catch (e) {
      console.warn('API users non accessible, fallback local :', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Ouverture modale pour ajout ou modification
  const handleOpenModal = (user = null) => {
    setShowPassword(false);
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        password: '',
        role: user.role || 'vendeur',
        is_active: user.is_active !== undefined ? user.is_active : 1
      });
    } else {
      setEditingUser(null);
      setFormData({
        full_name: '',
        username: '',
        password: '',
        role: 'vendeur',
        is_active: 1
      });
    }
    setIsModalOpen(true);
  };

  // Rôle actuellement sélectionné pour l'aide contextuelle
  const activeRoleObj = useMemo(() => {
    return ROLES.find((r) => r.id === formData.role) || ROLES[0];
  }, [formData.role]);

  // Sauvegarde (Création ou Mise à jour avec vérification stricte anti-doublon)
  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      showToast('Le nom complet est obligatoire.', 'error');
      return;
    }

    if (!editingUser && !formData.username.trim()) {
      showToast("Le nom d'utilisateur est obligatoire.", 'error');
      return;
    }

    // VÉRIFICATION D'UNICITÉ DU NOM D'UTILISATEUR
    const cleanUsername = formData.username.trim().toLowerCase();
    const isDuplicate = users.some(
      (u) =>
        String(u.username || '').trim().toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (isDuplicate) {
      showToast(
        `Le nom d'utilisateur « ${formData.username.trim()} » est déjà utilisé par un autre compte. Veuillez en choisir un autre.`,
        'error'
      );
      return;
    }

    // VÉRIFICATION DU MOT DE PASSE OBLIGATOIRE À LA CRÉATION
    if (!editingUser && !formData.password.trim()) {
      showToast('Le mot de passe est obligatoire pour créer un nouvel utilisateur.', 'error');
      return;
    }

    try {
      if (editingUser) {
        // Mise à jour existant
        const updatePayload = {
          full_name: formData.full_name.trim(),
          role: formData.role,
          is_active: formData.is_active
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const res = await updateUser(editingUser.id, updatePayload);

        // Mise à jour locale
        const updatedList = deduplicateUsers(
          users.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  full_name: updatePayload.full_name,
                  role: updatePayload.role,
                  is_active: updatePayload.is_active
                }
              : u
          )
        );
        setUsers(updatedList);
        localStorage.setItem('novamag_users', JSON.stringify(updatedList));

        // Si l'utilisateur connecté s'est modifié lui-même
        if (editingUser.id === currentUser?.id || editingUser.username === currentUser?.username) {
          const updatedSelf = {
            ...currentUser,
            full_name: updatePayload.full_name,
            role: updatePayload.role
          };
          setCurrentUser(updatedSelf);
          localStorage.setItem('novamag_user', JSON.stringify(updatedSelf));
        }

        window.dispatchEvent(new Event('novamag_user_updated'));
        showToast(res?.message || 'Utilisateur mis à jour avec succès.', 'success');
      } else {
        // Création nouvel utilisateur
        const createPayload = {
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role,
          is_active: formData.is_active
        };

        const res = await createUser(createPayload);
        if (res && res.success === false && res.message?.includes('déjà utilisé')) {
          showToast(res.message || "Ce nom d'utilisateur est déjà utilisé.", 'error');
          return;
        }

        const newUser = res?.data || {
          id: Date.now(),
          ...createPayload
        };

        const newList = deduplicateUsers([...users, newUser]);
        setUsers(newList);
        localStorage.setItem('novamag_users', JSON.stringify(newList));
        window.dispatchEvent(new Event('novamag_user_updated'));

        showToast(res?.message || 'Nouvel utilisateur créé avec succès.', 'success');
      }

      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Erreur lors de la sauvegarde.', 'error');
    }
  };

  // Suppression utilisateur
  const handleDeleteUser = (user) => {
    if (user.id === currentUser?.id || user.username === currentUser?.username) {
      showToast('Vous ne pouvez pas supprimer votre propre compte actuellement en cours d\'utilisation.', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous certain de vouloir supprimer l'utilisateur "${user.full_name}" (@${user.username}) ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await deleteUser(user.id);
          const filtered = deduplicateUsers(users.filter((u) => u.id !== user.id));
          setUsers(filtered);
          localStorage.setItem('novamag_users', JSON.stringify(filtered));
          window.dispatchEvent(new Event('novamag_user_updated'));
          showToast('Utilisateur supprimé avec succès.', 'success');
        } catch (e) {
          showToast('Erreur lors de la suppression.', 'error');
        }
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] p-6 select-none overflow-y-auto">
      {/* Toast */}
      <ModernToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ========================================================================= */}
      {/* EN-TÊTE PRINCIPAL (Image 1)                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-blue-600 dark:text-blue-400 shrink-0">
            <UserCog className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'ar' ? 'المستخدمون' : 'Utilisateurs'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {language === 'ar' ? 'إدارة صلاحيات الوصول وحسابات الموظفين' : "Gérer les autorisations d'accès et les utilisateurs"}
            </p>
          </div>
        </div>

        {/* Bouton "+ Ajouter un Utilisateur" (Image 1) */}
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Ajouter un Utilisateur'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TABLEAU DES UTILISATEURS (Image 1)                                        */}
      {/* ========================================================================= */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-4 px-6 text-left rtl:text-right">{language === 'ar' ? 'بيانات المستخدم' : 'INFO UTILISATEUR'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'اسم المستخدم' : "NOM D'UTILISATEUR"}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'الدور والصلاحيات' : 'RÔLE & AUTORISATIONS'}</th>
                <th className="py-4 px-6 text-center">{language === 'ar' ? 'الحالة' : 'STATUT'}</th>
                <th className="py-4 px-6 text-right rtl:text-left">{language === 'ar' ? 'إجراءات' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-xs">
              {users.map((u) => {
                const isCurrent =
                  u.id === currentUser?.id || u.username === currentUser?.username;
                const roleConfig = ROLES.find((r) => r.id === u.role) || ROLES[4];
                const isActive = u.is_active === 1;

                const getArabicRoleName = (rId) => {
                  switch(rId) {
                    case 'admin': return 'مسؤول النظام (كامل الصلاحيات)';
                    case 'caissier': return 'كاشير (صندوق فقط)';
                    case 'vendeur': return 'بائع (نقطة البيع فقط)';
                    case 'comptable': return 'محاسب (مالي + مشتريات + موردين)';
                    case 'assistant': return 'مساعد (كل الأقسام عدا الإعدادات)';
                    default: return rId;
                  }
                };

                const getArabicBadgeName = (rId) => {
                  switch(rId) {
                    case 'admin': return 'مسؤول';
                    case 'caissier': return 'كاشير';
                    case 'vendeur': return 'بائع';
                    case 'comptable': return 'محاسب';
                    case 'assistant': return 'مساعد';
                    default: return rId;
                  }
                };

                return (
                  <tr
                    key={`${u.id}-${u.username}`}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* INFO UTILISATEUR (Image 1 : BZ Technology) */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {u.full_name || u.username}
                      </span>
                    </td>

                    {/* NOM D'UTILISATEUR (Image 1 : badge admin) */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-semibold rounded-lg">
                        {u.username}
                      </span>
                    </td>

                    {/* RÔLE & AUTORISATIONS (Image 1 : badge Admin violet / autres rôles) */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3.5 py-1 text-xs font-bold rounded-lg ${roleConfig.badgeClass}`}
                      >
                        {language === 'ar' ? getArabicBadgeName(u.role) : roleConfig.badgeName}
                      </span>
                    </td>

                    {/* STATUT (Image 1 : badge Actif vert) */}
                    <td className="py-4 px-6 text-center">
                      {isActive ? (
                        <span className="inline-block px-3.5 py-1 bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg">
                          {language === 'ar' ? 'نشط' : 'Actif'}
                        </span>
                      ) : (
                        <span className="inline-block px-3.5 py-1 bg-rose-100/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-lg">
                          {language === 'ar' ? 'معطل' : 'Inactif'}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS (Image 1 : bouton Mon compte pour soi, sinon modifier/supprimer) */}
                    <td className="py-4 px-6 text-right rtl:text-left">
                      {isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handleOpenModal(u)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'ar' ? 'حسابي' : 'Mon compte'}</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{language === 'ar' ? 'تعديل' : 'Modifier'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'حذف' : 'Supprimer'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALE : GESTION DES UTILISATEURS (Images 2 & 4c02e58e.png)              */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Header de la modale */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'إدارة المستخدمين' : 'Gestion des Utilisateurs'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du formulaire */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {/* NOM COMPLET */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Contact className="w-4 h-4 text-slate-400" />
                  <span>{language === 'ar' ? 'الاسم الكامل' : 'NOM COMPLET'}</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Ex: BZ Technology"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold outline-hidden focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* NOM D'UTILISATEUR (POUR LA CONNEXION) */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{language === 'ar' ? 'اسم المستخدم (لتسجيل الدخول)' : "NOM D'UTILISATEUR (POUR LA CONNEXION)"}</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Ex: admin"
                  disabled={Boolean(editingUser)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold outline-hidden focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs font-mono"
                />
              </div>

              {/* MOT DE PASSE (CORRECTION PLACEHOLDER & OBLIGATOIRE À LA CRÉATION) */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <span>
                    {editingUser
                      ? (language === 'ar' ? 'كلمة المرور (اختيارية للتعديل)' : 'MOT DE PASSE (OPTIONNEL)')
                      : (language === 'ar' ? 'كلمة المرور (إلزامية) *' : 'MOT DE PASSE (OBLIGATOIRE) *')}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder={
                      editingUser
                        ? (language === 'ar' ? 'اتركه فارغاً إذا كنت لا ترغب في التعديل' : 'Laissez vide si vous ne souhaitez pas modifier')
                        : (language === 'ar' ? 'حدد كلمة المرور (إلزامية)' : 'Définir un mot de passe (obligatoire)')
                    }
                    required={!editingUser}
                    className="w-full px-4 py-2.5 pr-11 rtl:pr-4 rtl:pl-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-semibold outline-hidden focus:border-blue-500 shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* RÔLE & AUTORISATIONS + STATUT (Image 4c02e58e.png) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* RÔLE & AUTORISATIONS */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'ar' ? 'الدور والصلاحيات' : 'RÔLE & AUTORISATIONS'}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-hidden appearance-none cursor-pointer pr-10 rtl:pr-4 rtl:pl-10 shadow-2xs truncate"
                    >
                      <option value="vendeur">{language === 'ar' ? 'بائع (نقطة البيع فقط)' : 'Vendeur (Caisse uniquement)'}</option>
                      <option value="caissier">{language === 'ar' ? 'كاشير (صندوق فقط)' : 'Caissier (Caisse Uniquement)'}</option>
                      <option value="comptable">{language === 'ar' ? 'محاسب (مالي + مشتريات + موردين)' : 'Comptable (Financier + Fournisseurs + Achats)'}</option>
                      <option value="assistant">{language === 'ar' ? 'مساعد (كل الأقسام عدا الإعدادات)' : 'Assistant (Tout sauf Paramètres)'}</option>
                      <option value="admin">{language === 'ar' ? 'مسؤول النظام (كامل الصلاحيات)' : 'Administrateur (Tous les droits)'}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* STATUT */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'ar' ? 'الحالة' : 'STATUT'}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: Number(e.target.value)
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-hidden focus:border-blue-500 appearance-none cursor-pointer pr-10 rtl:pr-4 rtl:pl-10 shadow-2xs"
                    >
                      <option value={1}>{language === 'ar' ? 'نشط (دخول مسموح)' : 'Actif (Accès Normal)'}</option>
                      <option value={0}>{language === 'ar' ? 'معطل (دخول محظور)' : 'Inactif (Accès Bloqué)'}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Texte explicatif dynamique selon le rôle sélectionné */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 min-h-[38px]">
                {language === 'ar' ? (
                  formData.role === 'admin' ? 'صلاحيات كاملة وغير مقيدة في جميع أجزاء النظام والإعدادات والتقارير الحساسة.' :
                  formData.role === 'caissier' ? 'الوصول إلى نقطة البيع ومعاملات الخزينة والصندوق فقط.' :
                  formData.role === 'vendeur' ? 'الوصول إلى شاشة البيع فقط مع منع إضافة زبائن جدد أو تعديل الأسعار.' :
                  formData.role === 'comptable' ? 'الوصول إلى التقارير المالية وحركات الصندوق وفواتير المشتريات والموردين.' :
                  'الوصول إلى كافة الأقسام التشغيلية باستثناء إعدادات النظام الحساسة.'
                ) : activeRoleObj.description}
              </p>

              {/* Footer de la modale */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingUser
                      ? (language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer les Modifications')
                      : (language === 'ar' ? 'حفظ' : 'Enregistrer')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
