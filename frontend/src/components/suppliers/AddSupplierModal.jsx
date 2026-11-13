import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  X, 
  Building2, 
  Phone, 
  MapPin, 
  FileText, 
  Coins, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export default function AddSupplierModal({
  isOpen,
  onClose,
  onSave,
  supplierToEdit = null
}) {
  const { language, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [ai, setAi] = useState('');
  const [nis, setNis] = useState('');
  const [initialDebt, setInitialDebt] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || supplierToEdit.company || '');
      setPhone(supplierToEdit.phone || supplierToEdit.contact || '');
      setAddress(supplierToEdit.address || '');
      setRc(supplierToEdit.rc || '');
      setNif(supplierToEdit.nif || '');
      setAi(supplierToEdit.ai || '');
      setNis(supplierToEdit.nis || '');
      setInitialDebt(String(supplierToEdit.initialDebt ?? supplierToEdit.debt ?? 0));
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setRc('');
      setNif('');
      setAi('');
      setNis('');
      setInitialDebt('0');
    }
    setError('');
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المورد أو الشركة' : 'Veuillez saisir le nom du fournisseur ou de l\'entreprise');
      return;
    }

    const initDebtNum = Math.max(0, parseFloat(initialDebt) || 0);

    const supplierData = {
      id: supplierToEdit ? supplierToEdit.id : Date.now(),
      name: name.trim(),
      company: name.trim(),
      phone: phone.trim(),
      contact: phone.trim(),
      address: address.trim(),
      rc: rc.trim(),
      nif: nif.trim(),
      ai: ai.trim(),
      nis: nis.trim(),
      initialDebt: initDebtNum,
      debt: supplierToEdit 
        ? (Number(supplierToEdit.debt || 0) + (initDebtNum - Number(supplierToEdit.initialDebt || 0)))
        : initDebtNum,
      totalPurchases: supplierToEdit ? (supplierToEdit.totalPurchases || 0) : 0,
      purchaseCount: supplierToEdit ? (supplierToEdit.purchaseCount || 0) : 0,
      createdAt: supplierToEdit ? supplierToEdit.createdAt : new Date().toISOString()
    };

    onSave(supplierData, !!supplierToEdit);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ══ EN-TÊTE DU FORMULAIRE (Conforme Photo 2) ══ */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                {supplierToEdit ? (language === 'ar' ? 'تعديل بيانات المورد' : 'Modifier les Coordonnées du Fournisseur') : (language === 'ar' ? 'إضافة مورد جديد' : 'Ajouter un Nouveau Fournisseur')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'بطاقة التعريف، المعلومات الجبائية وإدارة الديون.' : "Fiche d'identification, informations fiscales et gestion des dettes."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* ══ CORPS DU FORMULAIRE ══ */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 scrollbar-thin">
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Fournisseur / Nom de l'entreprise (Champ principal) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <span>Fournisseur / Nom de l'entreprise</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : NovaMag Tech, Xprinter Algérie, Candia..."
                className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* 2. Téléphone & Adresse (2 colonnes) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Téléphone Principal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Numéro de téléphone principal
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : 0550 00 00 00 / 021 00 00 00"
                  className="w-full text-xs font-mono font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Adresse et Localisation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Adresse & Localisation
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex : Sétif, Centre Ville / Alger, Rouïba"
                  className="w-full text-xs font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Encadré Registre du Commerce & Informations Fiscales (Conforme Photo 2) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Registre du Commerce & Informations Fiscales</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* RC */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'السجل التجاري (RC)' : 'RC (Registre de Commerce)'}
                </label>
                <input
                  type="text"
                  value={rc}
                  onChange={(e) => setRc(e.target.value)}
                  placeholder="Ex : 19/00-9876543B19"
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* NIF */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'الرقم الجبائي (NIF)' : "NIF (Numéro d'Identification Fiscale)"}
                </label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="Ex : 191900000000000"
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* AI */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  AI (Article d'Imposition)
                </label>
                <input
                  type="text"
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  placeholder="Ex : 1901004523"
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* NIS */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {language === 'ar' ? 'الرقم الإحصائي (NIS)' : "NIS (Numéro d'Identification Statistique)"}
                </label>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Ex : 001919000000000"
                  className="w-full text-xs font-mono font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Encadré Dette Initiale (Conforme Photo 2 - En Français) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/60 space-y-2.5">
            <div className="flex items-start gap-2">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  {language === 'ar' ? 'الدين الأولي (المبلغ المستحق لهذا المورد قبل استخدام البرنامج)' : 'Dette Initiale (Montant que vous devez à ce fournisseur avant de commencer le logiciel)'}
                </label>
                <p className="text-[10.5px] text-amber-700 dark:text-amber-400/90 mt-0.5 font-medium">
                  {language === 'ar' ? 'سيتم احتساب هذا المبلغ في إجمالي دينك تجاه المورد. اتركه 0 إذا لم يوجد دين سابق.' : "Ce montant sera ajouté à votre dette globale envers ce fournisseur. Laissez 0 s'il n'y a pas de dette antérieure."}
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={initialDebt}
                onChange={(e) => setInitialDebt(e.target.value)}
                placeholder="0.00"
                className="w-full text-sm font-mono font-bold px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                DA
              </span>
            </div>
          </div>

          {/* Boutons d'action bas de formulaire */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === "ar" ? "إلغاء" : "Annuler"}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[2.4]" />
              <span>{supplierToEdit ? (language === 'ar' ? 'تحديث' : 'Mettre à jour') : (language === 'ar' ? 'حفظ المورد' : 'Enregistrer le Fournisseur')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
