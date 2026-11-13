import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Package,
  PackageX,
  CheckCheck,
  ChevronRight,
  TrendingDown,
  Clock,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export default function NotificationsPopover({
  isOpen,
  onClose,
  notifications = [],
  activePostIts = [],
  onTogglePostIt,
  onRestoreAllPostIts,
  onDismissNotification,
  onClearAll,
  onActionClick
}) {
  const { language } = useLanguage();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'danger' | 'warning'

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'danger') return n.severity === 'danger';
    if (filterType === 'warning') return n.severity === 'warning';
    return true;
  });

  const dangerCount = notifications.filter(n => n.severity === 'danger').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;

  return (
    <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-96 max-w-[95vw] bg-white dark:bg-[#0E1A30] border border-slate-200 dark:border-[#1E2E4E] rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scaleIn select-none">
      
      {/* ══ HEADER ══ */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-[#1E2E4E] flex items-center justify-between bg-slate-50/50 dark:bg-[#13223F]/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Bell className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'ar' ? 'التنبيهات والإشعارات' : 'Alertes & Notifications'}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
              {language === 'ar' ? `${notifications.length} تنبيهات نشطة` : `${notifications.length} alerte${notifications.length > 1 ? 's' : ''} active${notifications.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A2E55] transition-colors cursor-pointer"
              title={language === 'ar' ? 'مسح الكل' : 'Tout effacer'}
            >
              {language === 'ar' ? 'مسح الكل' : 'Effacer tout'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A2E55] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ══ FILTER TABS ══ */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-[#1E2E4E] flex items-center gap-1.5 bg-white dark:bg-[#0E1A30]">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#13223F]'
          }`}
        >
          {language === 'ar' ? `الكل (${notifications.length})` : `Toutes (${notifications.length})`}
        </button>

        {dangerCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterType('danger')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'danger'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>{language === 'ar' ? `حرجة (${dangerCount})` : `Critiques (${dangerCount})`}</span>
          </button>
        )}

        {warningCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterType('warning')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'warning'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{language === 'ar' ? `تنبيهات (${warningCount})` : `Attentions (${warningCount})`}</span>
          </button>
        )}
      </div>

      {/* ══ NOTIFICATIONS LIST ══ */}
      <div className="max-h-80 overflow-y-auto p-2.5 space-y-2 scrollbar-thin divide-y divide-slate-100/60 dark:divide-slate-800/60">
        {filteredNotifs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-1">
            <CheckCheck className="w-8 h-8 mx-auto text-emerald-500 stroke-[1.8]" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? 'كل شيء تحت السيطرة !' : 'Tout est sous contrôle !'}
            </p>
            <p className="text-[11px]">
              {language === 'ar' ? 'لا توجد تنبيهات نفاذ مخزون أو انتهاء صلاحية حالياً.' : 'Aucune alerte de stock ou de péremption pour le moment.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const isDanger = notif.severity === 'danger';
            const isWarning = notif.severity === 'warning';

            return (
              <div
                key={notif.id}
                className={`pt-2 first:pt-0 p-2.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
                  isDanger
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-900/50 hover:border-rose-300'
                    : isWarning
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-900/50 hover:border-amber-300'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/90 dark:border-blue-900/50'
                }`}
              >
                {/* Icon Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isDanger
                      ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : isWarning
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {notif.category === 'stock' ? (
                    isDanger ? <PackageX className="w-4 h-4 stroke-[2.2]" /> : <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                  ) : notif.category === 'expiry' ? (
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 stroke-[2.2]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                        isDanger
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : isWarning
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {notif.title}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {activePostIts.some((p) => p.id === notif.id) && (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          📌 Post-it
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismissNotification && onDismissNotification(notif.id)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
                        title={language === 'ar' ? 'تجاهل' : 'Ignorer'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
                    {notif.productName}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 dark:border-slate-800/80 gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePostIt && onTogglePostIt(notif)}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Afficher ou masquer cette alerte sous forme de note Post-it flottante"
                    >
                      <span>📌</span>
                      <span>
                        {activePostIts.some((p) => p.id === notif.id)
                          ? (language === 'ar' ? 'إخفاء من الملاحظات' : 'Fermer Post-it')
                          : (language === 'ar' ? 'إعادة التثبيت كملاحظة' : 'Remettre en Post-it')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onActionClick && onActionClick(notif)}
                      className={`text-[10px] font-bold flex items-center gap-0.5 hover:underline cursor-pointer ${
                        isDanger
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      <span>{notif.actionLabel || (language === 'ar' ? 'فحص' : 'Inspecter')}</span>
                      <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ══ FOOTER ══ */}
      <div className="p-2.5 border-t border-slate-100 dark:border-[#1E2E4E] bg-slate-50/70 dark:bg-[#13223F]/50 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'ar' ? 'مراقبة المخزون والصلاحية نشطة' : 'Surveillance stock & DLUO active'}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-bold cursor-pointer"
        >
          {language === 'ar' ? 'إغلاق' : 'Fermer'}
        </button>
      </div>

    </div>
  );
}
