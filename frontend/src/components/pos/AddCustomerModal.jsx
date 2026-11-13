import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserPlus, 
  Phone, 
  MapPin, 
  Building2, 
  CreditCard, 
  Check, 
  Calendar,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const getTodayDateStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddCustomerModal({ isOpen, onClose, onSave, customerToEdit = null }) {
  const { language, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [registerDate, setRegisterDate] = useState(getTodayDateStr());
  const [rc, setRc] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [ai, setAi] = useState('');
  const [initialDebt, setInitialDebt] = useState('0');
  const [maxDebtLimit, setMaxDebtLimit] = useState('0');

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        setName(customerToEdit.name || '');
        setPhone(customerToEdit.phone || '');
        setAddress(customerToEdit.address || '');
        setRegisterDate(
          customerToEdit.registerDate ||
          (customerToEdit.createdAt ? customerToEdit.createdAt.split('T')[0] : getTodayDateStr())
        );
        setRc(customerToEdit.rc || '');
        setNif(customerToEdit.nif || '');
        setNis(customerToEdit.nis || '');
        setAi(customerToEdit.ai || '');
        const currentDebt = customerToEdit.balance < 0 ? Math.abs(customerToEdit.balance) : (customerToEdit.debt || customerToEdit.initialDebt || 0);
        setInitialDebt(String(currentDebt || 0));
        setMaxDebtLimit(String(customerToEdit.maxDebtLimit || 0));
      } else {
        setName('');
        setPhone('');
        setAddress('');
        setRegisterDate(getTodayDateStr());
        setRc('');
        setNif('');
        setNis('');
        setAi('');
        setInitialDebt('0');
        setMaxDebtLimit('0');
      }

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, customerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedInitialDebt = parseFloat(initialDebt) || 0;
    const parsedMaxDebt = parseFloat(maxDebtLimit) || 0;

    if (customerToEdit) {
      const updatedCustomer = {
        ...customerToEdit,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        registerDate: registerDate || getTodayDateStr(),
        rc: rc.trim(),
        nif: nif.trim(),
        nis: nis.trim(),
        ai: ai.trim(),
        maxDebtLimit: parsedMaxDebt
      };
      if (parsedInitialDebt !== Math.abs(customerToEdit.balance || 0)) {
        updatedCustomer.balance = -parsedInitialDebt;
        updatedCustomer.debt = parsedInitialDebt;
      }
      onSave && onSave(updatedCustomer, true);
    } else {
      const newCustomer = {
        id: Date.now(),
        barcode: `CLI-${String(Date.now()).slice(-5)}`,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        registerDate: registerDate || getTodayDateStr(),
        rc: rc.trim(),
        nif: nif.trim(),
        nis: nis.trim(),
        ai: ai.trim(),
        initialDebt: parsedInitialDebt,
        balance: -parsedInitialDebt,
        debt: parsedInitialDebt,
        maxDebtLimit: parsedMaxDebt,
        createdAt: new Date().toISOString()
      };
      onSave && onSave(newCustomer, false);
    }
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-fadeIn select-none overflow-y-auto">
      <div 
        className="bg-white dark:bg-[#111C35] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl space-y-4 animate-scaleIn relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {customerToEdit 
                  ? (language === 'ar' ? 'تعديل بيانات الزبون' : 'Modifier les informations du client')
                  : (language === 'ar' ? 'إضافة زبون دائم' : 'Ajouter un client régulier')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {customerToEdit 
                  ? (language === 'ar' ? `تحديث ملف ${customerToEdit.name}` : `Mise à jour du profil de ${customerToEdit.name}`)
                  : (language === 'ar' ? 'بيانات الاتصال، المعلومات الجبائية وسقف الدين' : 'Coordonnées, données fiscales et gestion du plafond de crédit')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'ar' ? 'إغلاق' : 'Fermer'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Ligne 1 : Nom & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-left rtl:text-right">
                {language === 'ar' ? 'الاسم / الاسم التجاري' : 'Nom / Raison Sociale'} <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: محل النجاح، محمد...' : 'Ex: SARL Commerce, Mohamed...'}
                className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-blue-500/15 transition-all text-left rtl:text-right placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-left rtl:text-right">
                {language === 'ar' ? 'رقم الهاتف' : 'Numéro de téléphone'}
              </label>
              <div className="relative flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-900 overflow-hidden focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all">
                <Phone className="w-4 h-4 text-slate-400 ml-3 rtl:ml-0 rtl:mr-3 pointer-events-none shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05 / 06 / 07..."
                  className="w-full text-sm font-semibold px-3 py-2.5 bg-transparent text-slate-900 dark:text-white outline-none text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Ligne 2 : Adresse & Date d'enregistrement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 text-left rtl:text-right">
                {language === 'ar' ? 'العنوان أو الولاية' : 'Adresse ou Wilaya'}
              </label>
              <div className="relative flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-900 overflow-hidden focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all">
                <MapPin className="w-4 h-4 text-slate-400 ml-3 rtl:ml-0 rtl:mr-3 pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: الجزائر، وهران، قسنطينة...' : 'Ex: Alger, Blida, Oran, Constantine...'}
                  className="w-full text-sm font-semibold px-3 py-2.5 bg-transparent text-slate-900 dark:text-white outline-none text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'تاريخ التسجيل' : "Date d'enregistrement"}
                </label>
                <button
                  type="button"
                  onClick={() => setRegisterDate(getTodayDateStr())}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'ar' ? 'اليوم' : "Aujourd'hui"}
                </button>
              </div>
              <div className="relative flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-900 overflow-hidden focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-3 focus-within:ring-blue-500/15 transition-all">
                <Calendar className="w-4 h-4 text-blue-600 ml-3 rtl:ml-0 rtl:mr-3 pointer-events-none shrink-0" />
                <input
                  type="date"
                  value={registerDate}
                  onChange={(e) => setRegisterDate(e.target.value)}
                  onClick={(e) => {
                    try { e.target.showPicker(); } catch(err){}
                  }}
                  className="w-full text-sm font-semibold px-3 py-2.5 bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer text-left rtl:text-right"
                />
              </div>
            </div>
          </div>

          {/* Ligne 3 : Informations Fiscales */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5 text-left rtl:text-right">
              {language === 'ar' ? 'المعلومات الجبائية والإدارية' : 'Identifiants fiscaux & administratifs'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 text-left rtl:text-right">
                  {language === 'ar' ? 'السجل التجاري RC' : 'RC (Reg. Commerce)'}
                </label>
                <input
                  type="text"
                  value={rc}
                  onChange={(e) => setRc(e.target.value)}
                  placeholder="N° RC"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 text-left rtl:text-right">
                  {language === 'ar' ? 'الرقم الجبائي NIF' : 'NIF (Ident. Fiscale)'}
                </label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="N° NIF"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 text-left rtl:text-right">
                  {language === 'ar' ? 'رقم الإحصاء NIS' : 'NIS (Statistique)'}
                </label>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="N° NIS"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 text-left rtl:text-right">
                  {language === 'ar' ? 'رقم المادة AI' : 'AI (Article Impos.)'}
                </label>
                <input
                  type="text"
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  placeholder="N° AI"
                  className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-left rtl:text-right placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Ligne 4 : Dette Initiale & Plafond de dette */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Cadre Dette Initiale */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-800 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                <label className="block text-xs font-black text-amber-900 dark:text-amber-200 text-left rtl:text-right">
                  {language === 'ar' ? 'الدين الافتتاحي (السابق)' : 'Dette initiale (antérieure)'}
                </label>
              </div>
              
              <div className="relative flex items-center border border-amber-300 dark:border-amber-700/80 rounded-xl bg-white dark:bg-slate-900 px-3.5 py-2 shadow-inner focus-within:ring-2 focus-within:ring-amber-500/20">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialDebt}
                  onChange={(e) => setInitialDebt(e.target.value)}
                  placeholder="0"
                  className="w-full text-left rtl:text-right text-lg font-mono font-black text-amber-900 dark:text-amber-100 bg-transparent outline-none"
                />
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 ml-2 rtl:ml-0 rtl:mr-2 shrink-0">
                  DA
                </span>
              </div>

              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 text-left rtl:text-right font-medium leading-tight">
                {language === 'ar' 
                  ? 'الديون السابقة قبل استخدام البرنامج. اتركه 0 إن لم تكن هناك ديون.' 
                  : "Dette antérieure avant l'utilisation du logiciel. Laissez 0 si aucune."}
              </p>
            </div>

            {/* Cadre Plafond de Dette */}
            <div className="bg-blue-50/80 dark:bg-blue-950/30 border-2 border-blue-300/80 dark:border-blue-800 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <label className="block text-xs font-black text-blue-900 dark:text-blue-200 text-left rtl:text-right">
                  {language === 'ar' ? 'سقف الدين (الحد الأقصى للكريدي)' : 'Plafond de dette (Max crédit autorisé)'}
                </label>
              </div>

              <div className="relative flex items-center border border-blue-300 dark:border-blue-700/80 rounded-xl bg-white dark:bg-slate-900 px-3.5 py-2 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxDebtLimit}
                  onChange={(e) => setMaxDebtLimit(e.target.value)}
                  placeholder="0"
                  className="w-full text-left rtl:text-right text-lg font-mono font-black text-blue-900 dark:text-blue-100 bg-transparent outline-none"
                />
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 ml-2 rtl:ml-0 rtl:mr-2 shrink-0">
                  DA
                </span>
              </div>

              <p className="text-[11px] text-blue-800/90 dark:text-blue-300/90 text-left rtl:text-right font-medium leading-tight">
                {language === 'ar' 
                  ? 'أقصى مبلغ مسموح به كدين. اتركه 0 لسقف غير محدود.' 
                  : 'Montant max de crédit autorisé. Laissez 0 pour crédit illimité.'}
              </p>
            </div>

          </div>

          {/* Boutons d'action */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-3 px-6 rounded-2xl font-black text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{customerToEdit 
                ? (language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer les modifications') 
                : (language === 'ar' ? 'تسجيل الزبون' : 'Enregistrer le client')}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
