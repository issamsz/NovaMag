/**
 * NovaMag POS - Service Audio & Sons Dynamiques
 * Synthèse sonore Web Audio API haute fidélité pour les validations de caisse, scans et alertes.
 */

export const SOUND_OPTIONS = [
  { id: 'chime', name: 'Son 1 : Carillon Caisse Moderne', description: 'Harmonieuse montée de deux notes douces (Style caisse moderne)' },
  { id: 'beep',  name: 'Son 2 : Double Bip TPE Express',  description: 'Deux bips rapides et nets (Style validation carte bancaire)' },
  { id: 'bell',  name: 'Son 3 : Clochette Cristalline',   description: 'Ding aigu et cristallin résonant (Style boutique de luxe)' }
];

/**
 * Joue le son de confirmation de validation de vente ou de modification
 * Prend en compte dynamiquement le volume réglé dans les Paramètres (0% à 100%)
 */
export function playSaleValidationSound(soundTypeOverride = null, volumeOverride = null) {
  try {
    let isActive = true;
    let volumePercent = 75;
    let chosenSound = 'chime';

    // 1. Récupération dynamique des paramètres actuels
    try {
      const saved = localStorage.getItem('novamag_system_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.soundAlertsActive === false) {
          isActive = false;
        }
        if (typeof settings.soundVolume === 'number') {
          volumePercent = settings.soundVolume;
        }
        if (settings.saleValidationSound) {
          chosenSound = settings.saleValidationSound;
        }
      }
    } catch (e) {}

    // Surcharges directes si appel depuis le bouton de test
    if (typeof volumeOverride === 'number') volumePercent = volumeOverride;
    if (soundTypeOverride) chosenSound = soundTypeOverride;

    if (!isActive && volumeOverride === null) return;
    if (volumePercent <= 0) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Calcul du volume réel et dynamique (courbe naturelle linéaire/douce)
    const normalizedVol = Math.max(0, Math.min(100, volumePercent)) / 100;
    const masterGainValue = normalizedVol * 0.35;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterGainValue, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (chosenSound === 'beep' || chosenSound === 'sound2') {
      // ══════ SON 2 : Double Bip TPE Express ══════
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1250, now);
      gain1.gain.setValueAtTime(1, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.06);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1650, now + 0.08);
      gain2.gain.setValueAtTime(1, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.16);

    } else if (chosenSound === 'bell' || chosenSound === 'sound3') {
      // ══════ SON 3 : Clochette Cristalline (Ding résonant) ══════
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.42);

      const oscHarm = ctx.createOscillator();
      const gainHarm = ctx.createGain();
      oscHarm.type = 'sine';
      oscHarm.frequency.setValueAtTime(3520, now);
      gainHarm.gain.setValueAtTime(0.35, now);
      gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      oscHarm.connect(gainHarm);
      gainHarm.connect(masterGain);
      oscHarm.start(now);
      oscHarm.stop(now + 0.22);

    } else {
      // ══════ SON 1 : Carillon Caisse Moderne (Do-Sol montant) ══════
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1046.5, now); // Do 6
      gain1.gain.setValueAtTime(0.9, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.16);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1567.98, now + 0.07); // Sol 6
      gain2.gain.setValueAtTime(1, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.38);
    }
  } catch (err) {
    console.warn('[NovaMag Audio] Erreur de synthèse sonore:', err);
  }
}
