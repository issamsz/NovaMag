import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  BarChart2,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ShoppingBag,
  Lightbulb,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Suggestions rapides 'Smart Chips'
const SMART_CHIPS = [
  {
    id: 'rupture',
    label: '📦 Produits en rupture ?',
    labelAr: '📦 المنتجات التي نفدت أو شارفت؟',
    query: 'Quels sont les produits actuellement en rupture de stock ou sous le seuil d\'alerte ?'
  },
  {
    id: 'previsions',
    label: '📈 Prévisions de ventes demain',
    labelAr: '📈 توقعات المبيعات ليوم غد',
    query: 'Quelle est la prévision des ventes pour la journée de demain ?'
  },
  {
    id: 'marges',
    label: '💰 Analyser mes marges',
    labelAr: '💰 تحليل هامش الربح',
    query: 'Fais une analyse détaillée de mes marges bénéficiaires et de ma rentabilité globale.'
  },
  {
    id: 'top5',
    label: '⭐ Top 5 articles les plus rentables',
    labelAr: '⭐ أفضل 5 منتجات ربحية',
    query: 'Quels sont les 5 articles qui génèrent le plus de bénéfice net ce mois-ci ?'
  }
];

// Réponses simulées riches et réalistes du Copilote
const MOCK_AI_RESPONSES = {
  rupture: {
    title: 'Analyse des Stocks Critiques & Ruptures',
    subtitle: 'Audit automatisé sur 124 références répertoriées',
    stats: [
      { label: 'Articles en rupture', value: '2', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
      { label: 'Sous seuil d\'alerte', value: '3', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
      { label: 'Taux de disponibilité', value: '96.2%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' }
    ],
    items: [
      { name: 'Pain Baguette Tradition', status: 'Rupture', stock: '0 unité', alert: 'Rupture constatée à 17h30', severity: 'danger' },
      { name: 'Lait Candia Silhouette 1L', status: 'Critique', stock: '2 unités', alert: 'Seuil minimum : 10 unités', severity: 'warning' },
      { name: 'Eau Minérale Ifri 1.5L (Pack 6)', status: 'Alerte', stock: '4 fardeaux', alert: 'Écoulement prévu en fin de soirée', severity: 'warning' }
    ],
    recommendation: 'Conseil IA : Contactez prioritairement votre fournisseur « Candia Laiterie » pour passer un réassort dès demain matin à 08h00. Vous pouvez générer le bon de commande en 1 clic dans l\'onglet Achats.'
  },
  previsions: {
    title: 'Prévisions Intelligentes des Ventes — Demain',
    subtitle: 'Modèle prédictif basé sur l\'historique des 30 derniers jours et la météo',
    stats: [
      { label: 'Chiffre d\'affaires estimé', value: '86 500 DA', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
      { label: 'Variation attendue', value: '+7.8%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
      { label: 'Tickets prévus', value: '~142 clients', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' }
    ],
    insights: [
      '🔥 Heure de pointe attendue : entre 11h30 et 13h15, puis entre 17h00 et 19h30.',
      '🥐 Rayon Boulangerie & Frais : forte hausse anticipée (+15% par rapport à la moyenne).',
      '💵 Fond de caisse conseillé : Prévoir au moins 18 000 DA en petites coupures (200, 500 DA) et monnaie métallique pour fluidifier les passages.'
    ],
    recommendation: 'Conseil IA : Assurez la présence de 2 caissiers pendant le pic de 17h00 pour maintenir un temps d\'attente sous 1 minute par client.'
  },
  marges: {
    title: 'Diagnostic de Santé Financière & Marges',
    subtitle: 'Calcul dynamique du taux de marge brute commerciale',
    stats: [
      { label: 'Marge moyenne globale', value: '28.4%', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
      { label: 'Bénéfice net estimé (30j)', value: '312 400 DA', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
      { label: 'Objectif mensuel', value: 'Atteint à 104%', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' }
    ],
    insights: [
      '💎 Rayon le plus rentable : Périphériques & Accessoires caisse (39.5% de marge brute moyenne).',
      '🧀 Rayon Alimentation & Frais : 24.2% de marge (bon volume de rotation quotidien).',
      '⚠️ Attention produit d\'appel : L\'Huile de Table est vendue avec seulement 4.8% de marge brute.'
    ],
    recommendation: 'Opportunité détectée : Créer une offre groupée (Pack Goûter ou Pack Petit Déjeuner) pour doper la marge moyenne de 3.2% sans perte de volume.'
  },
  top5: {
    title: 'Top 5 des Articles les Plus Rentables',
    subtitle: 'Classement par bénéfice net total généré sur la période active',
    ranking: [
      { rank: 1, name: 'Imprimante Thermique Xprinter XP-N160II', margin: '+3 000 DA / unité', volume: '14 vendues', totalNet: '42 000 DA' },
      { rank: 2, name: 'Café Familico Torréfié 250g', margin: '+110 DA / unité', volume: '185 vendus', totalNet: '20 350 DA' },
      { rank: 3, name: 'Fromage La Vache Qui Rit 16P', margin: '+48 DA / unité', volume: '340 boîtes', totalNet: '16 320 DA' },
      { rank: 4, name: 'Boisson Gazeuse Hamoud Boualem 1L', margin: '+32 DA / unité', volume: '420 bouteilles', totalNet: '13 440 DA' },
      { rank: 5, name: 'Croissant Artisanal Beurre', margin: '+15 DA / unité', volume: '620 pièces', totalNet: '9 300 DA' }
    ],
    recommendation: 'Conseil IA : Placez l\'article « Café Familico » à hauteur des yeux ou à proximité directe de la caisse pour stimuler les achats d\'impulsion.'
  }
};

export default function NovaIaCopilotView({ onNavigate }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      timestamp: 'À l\'instant',
      content: 'Bonjour ! Je suis **NovaIA**, votre copilote intelligent de gestion. J\'analyse en temps réel vos ventes, vos marges et votre inventaire pour vous aider à prendre les meilleures décisions commerciales.\n\nComment puis-je vous éclairer aujourd\'hui ?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Envoyer une question
  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // Message utilisateur
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Déterminer la réponse IA correspondante
    let responseData = null;
    const lower = query.toLowerCase();

    if (lower.includes('rupture') || lower.includes('stock') || lower.includes('épuisé')) {
      responseData = { type: 'rupture', data: MOCK_AI_RESPONSES.rupture };
    } else if (lower.includes('prévision') || lower.includes('demain') || lower.includes('tendance')) {
      responseData = { type: 'previsions', data: MOCK_AI_RESPONSES.previsions };
    } else if (lower.includes('marge') || lower.includes('rentab') || lower.includes('bénéfice')) {
      responseData = { type: 'marges', data: MOCK_AI_RESPONSES.marges };
    } else if (lower.includes('top') || lower.includes('meilleur') || lower.includes('plus vendu')) {
      responseData = { type: 'top5', data: MOCK_AI_RESPONSES.top5 };
    } else {
      responseData = {
        type: 'general',
        data: {
          title: 'Analyse Stratégique NovaIA',
          text: `D'après l'analyse des données de caisse actuelles de votre magasin NovaMag :\n\n• Votre chiffre d'affaires est stable avec une fréquentation soutenue en début d'après-midi.\n• Le panier moyen s'établit à **1 480 DA**, avec en moyenne 4.2 articles par ticket.\n• Les clients règlent à 88% en espèces et 12% en crédit différé.\n\nSouhaitez-vous une recommandation spécifique sur un rayon ou un fournisseur particulier ?`
        }
      };
    }

    // Effet réaliste de frappe / typing
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responseData
        }
      ]);
    }, 1100);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        timestamp: 'À l\'instant',
        content: 'Conversation réinitialisée. Que souhaitez-vous analyser maintenant ?'
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 select-none">
      
      {/* ── EN-TÊTE SUPÉRIEUR ── */}
      <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111C35] flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                NovaIA Copilot ✨
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Stock & Ventes
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assistant d'aide à la décision stratégique et prévisions du magasin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Effacer la conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        </div>
      </div>

      {/* ── ZONE DE CONVERSATION (FEED) ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-violet-500/20'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              </div>

              {/* Bulle / Carte de message */}
              <div className={`max-w-[88%] sm:max-w-[80%] space-y-1`}>
                
                {/* Horodatage */}
                <div
                  className={`text-[10px] text-slate-400 font-medium px-1 ${
                    msg.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.sender === 'user' ? 'Vous' : 'NovaIA Copilot'} • {msg.timestamp}
                </div>

                {/* Contenu textuel standard */}
                {msg.content && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-md shadow-blue-600/15'
                        : 'bg-white dark:bg-[#111C35] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-800 shadow-2xs whitespace-pre-line'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Réponse riche structurée de l'IA */}
                {msg.responseData && (
                  <div className="bg-white dark:bg-[#111C35] rounded-2xl rounded-tl-xs border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
                    
                    {/* En-tête de carte IA */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {msg.responseData.data.title}
                        </h3>
                      </div>
                      {msg.responseData.data.subtitle && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {msg.responseData.data.subtitle}
                        </p>
                      )}
                    </div>

                    {/* KPIs en grille si présents */}
                    {msg.responseData.data.stats && (
                      <div className="grid grid-cols-3 gap-2.5">
                        {msg.responseData.data.stats.map((st, idx) => (
                          <div key={idx} className={`p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 ${st.bg}`}>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block truncate">
                              {st.label}
                            </span>
                            <span className={`text-xs sm:text-sm font-black tracking-tight mt-0.5 block ${st.color}`}>
                              {st.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Liste d'articles en alerte (Cas Rupture) */}
                    {msg.responseData.data.items && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Détails des articles prioritaires :
                        </span>
                        <div className="space-y-1.5">
                          {msg.responseData.data.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                  {it.name}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {it.alert}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                  it.severity === 'danger'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {it.stock}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Classement Top 5 si présent */}
                    {msg.responseData.data.ranking && (
                      <div className="space-y-2">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {msg.responseData.data.ranking.map((rk) => (
                            <div key={rk.rank} className="py-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-black text-[11px] flex items-center justify-center shrink-0">
                                  #{rk.rank}
                                </span>
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                    {rk.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {rk.volume} • Marge : {rk.margin}
                                  </span>
                                </div>
                              </div>
                              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0 font-mono">
                                {rk.totalNet}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights sous forme de puces */}
                    {msg.responseData.data.insights && (
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {msg.responseData.data.insights.map((ins, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-violet-600 dark:text-violet-400 mt-0.5">•</span>
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Texte libre si présent */}
                    {msg.responseData.data.text && (
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                        {msg.responseData.data.text}
                      </div>
                    )}

                    {/* Recommandation finale mise en valeur */}
                    {msg.responseData.data.recommendation && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/80 dark:border-violet-800/50 flex items-start gap-2.5 text-xs text-violet-900 dark:text-violet-200">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-medium">
                          {msg.responseData.data.recommendation}
                        </span>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Indicateur de saisie / typing animation */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <div className="bg-white dark:bg-[#111C35] rounded-2xl rounded-tl-xs border border-slate-200/90 dark:border-slate-800 px-4 py-3 shadow-2xs flex items-center gap-2">
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  NovaIA analyse vos données de caisse
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── ZONE INFÉRIEURE : SMART CHIPS & INPUT ── */}
      <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111C35]">
        <div className="max-w-3xl mx-auto space-y-3">
          
          {/* Smart Chips rapides au-dessus de l'input */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SMART_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-violet-50 dark:bg-slate-800/80 dark:hover:bg-violet-950/50 text-slate-700 hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300 border border-slate-200/80 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                <span>{language === 'ar' ? chip.labelAr : chip.label}</span>
              </button>
            ))}
          </div>

          {/* Formulaire d'envoi textuel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'اطرح سؤالاً على مساعد NovaIA حول المبيعات، المخزون، أو التوقعات...'
                  : 'Posez une question sur vos ventes, votre stock ou demandez un conseil...'
              }
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`absolute right-2 p-2 rounded-xl text-white transition-all ${
                inputText.trim() && !isTyping
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              NovaIA Copilot • Version 2.4 Premium
            </span>
            <span>
              Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Entrée ↵</kbd> pour envoyer
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
