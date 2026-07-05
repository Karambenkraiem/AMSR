import React, { useState, useEffect } from 'react';

const DISMISS_KEY   = 'amsr_install_dismissed_until';
const DISMISS_DAYS  = 14;
const APK_URL       = 'https://amsr.alkaramsoft.ovh/download/amsr-steg.apk';

/* ── helpers ─────────────────────────────────────────────────── */
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
}
function detectOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/ipad|iphone|ipod/i.test(ua) && !window.MSStream) return 'ios';
  return 'desktop';
}
function isDismissed() {
  const v = localStorage.getItem(DISMISS_KEY);
  return v && Date.now() < Number(v);
}

/* ── icônes ──────────────────────────────────────────────────── */
const IconAndroid = ({ cls = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
    <path d="M3.18 23.76c.3.17.64.24.99.2l12.45-11.7-2.76-2.76L3.18 23.76zm17.29-12.21c.32-.29.53-.7.53-1.17s-.2-.88-.52-1.17L18.3 7.8l-3.07 3.07 3.07 3.07 2.17-2.39zM2.01 1.05C1.7 1.35 1.5 1.8 1.5 2.37v19.26c0 .57.2 1.02.51 1.32l.07.06L13.15 12 2.08.99l-.07.06zm11.1 10.59L2.08 23.67l.06.06c.3.28.7.43 1.1.38.29-.04.56-.16.79-.32L16.48 15.8l-3.37-4.16z"/>
  </svg>
);
const IconApple = ({ cls = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);
const IconShare = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 inline mx-0.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

/* ── guide iOS ───────────────────────────────────────────────── */
function IosGuide() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-800">Installer sur iPhone / iPad — sans App Store</p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2.5">
        {[
          <>Ouvre ce site dans <b>Safari</b> (pas Chrome)</>,
          <>Appuie sur l'icône Partager <IconShare /> en bas de l'écran</>,
          <>Sélectionne <b>« Ajouter à l'écran d'accueil »</b></>,
          <>Appuie sur <b>Ajouter</b> — l'app apparaît sur ton écran</>,
        ].map((txt, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
            <p className="text-sm text-gray-700 leading-snug">{txt}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">L'app s'ouvre en plein écran, sans barre Safari.</p>
    </div>
  );
}

/* ── composant principal ─────────────────────────────────────── */
export default function AppInstallPrompt({ forceShow = false, onClose }) {
  const [show,           setShow]           = useState(false);
  const [os,             setOs]             = useState('desktop');
  const [leaving,        setLeaving]        = useState(false);
  const [nativePrompt,   setNativePrompt]   = useState(null); // beforeinstallprompt event

  useEffect(() => {
    if (window.Capacitor?.isNativePlatform?.()) return;
    if (isStandalone()) return; // déjà installée, pas de suggestion

    if (forceShow) { setOs(detectOS()); setShow(true); return; }
    if (isDismissed()) return;

    const detectedOs = detectOS();
    setOs(detectedOs);

    // Android Chrome : écouter l'événement natif d'installation PWA
    const handler = (e) => {
      e.preventDefault();
      setNativePrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS / desktop : délai avant affichage
    const t = setTimeout(() => setShow(true), 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(t);
    };
  }, [forceShow]);

  const dismiss = () => {
    setLeaving(true);
    if (!forceShow) {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400_000));
    }
    setTimeout(() => { setShow(false); onClose?.(); }, 320);
  };

  const installNative = async () => {
    if (!nativePrompt) return;
    nativePrompt.prompt();
    await nativePrompt.userChoice;
    setNativePrompt(null);
    dismiss();
  };

  if (!show) return null;

  const isAndroid = os === 'android';
  const isIos     = os === 'ios';
  const isMobile  = isAndroid || isIos;
  const animIn  = isMobile ? 'slideUp .35s ease-out forwards'  : 'fadeIn .3s forwards';
  const animOut = isMobile ? 'slideDown .3s ease-in forwards'  : 'fadeOut .3s forwards';

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-[9998]"
          style={{ animation: leaving ? 'fadeOut .3s forwards' : 'fadeIn .3s forwards' }}
          onClick={dismiss}
        />
      )}

      <div
        className={`fixed z-[9999] bg-white shadow-2xl ${
          isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-3xl'
            : 'bottom-5 right-5 w-80 rounded-2xl border border-gray-100'
        }`}
        style={{ animation: leaving ? animOut : animIn }}
      >
        {isMobile && (
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#003366] flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 leading-tight">AMSR — STEG</p>
              <p className="text-xs text-gray-500 mt-0.5">Application de Mise Sous Régime</p>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}
              </div>
            </div>
            <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
          </div>

          {/* Android Chrome → bouton natif OR lien APK */}
          {isAndroid && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Installez l'application STEG sur votre Android.
              </p>
              {nativePrompt ? (
                <button
                  onClick={installNative}
                  className="flex items-center gap-3 bg-gray-900 hover:bg-gray-700 text-white px-4 py-3.5 rounded-xl transition-colors w-full"
                >
                  <IconAndroid cls="w-7 h-7 shrink-0" />
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Installation directe</div>
                    <div className="font-bold leading-tight">Installer l'application</div>
                  </div>
                </button>
              ) : (
                <a href={APK_URL} onClick={dismiss}
                  className="flex items-center gap-3 bg-gray-900 hover:bg-gray-700 text-white px-4 py-3.5 rounded-xl transition-colors w-full">
                  <IconAndroid cls="w-7 h-7 shrink-0" />
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Télécharger le fichier APK</div>
                    <div className="font-bold leading-tight">Installer sur Android</div>
                  </div>
                </a>
              )}
              {!nativePrompt && (
                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  Activez « Sources inconnues » dans Paramètres › Sécurité si demandé
                </p>
              )}
            </div>
          )}

          {isIos && <IosGuide />}

          {/* Desktop */}
          {!isMobile && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Accédez à AMSR depuis votre smartphone :</p>
              <div className="grid grid-cols-2 gap-2">
                <a href={APK_URL} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-3 py-2.5 rounded-xl transition-colors">
                  <IconAndroid cls="w-5 h-5 shrink-0" />
                  <div><div className="text-[9px] text-gray-400 leading-none">Fichier APK</div><div className="text-xs font-bold">Android</div></div>
                </a>
                <div className="flex items-center gap-2 bg-gray-100 text-gray-400 px-3 py-2.5 rounded-xl">
                  <IconApple cls="w-5 h-5 shrink-0" />
                  <div><div className="text-[9px] leading-none">Safari → Partager</div><div className="text-xs font-bold">iPhone / iPad</div></div>
                </div>
              </div>
            </div>
          )}

          <button onClick={dismiss} className="w-full py-2 text-sm text-gray-400 hover:text-gray-500">
            Non merci, continuer sur le site
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp   { from { transform:translateY(100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes slideDown { from { transform:translateY(0); opacity:1 }   to { transform:translateY(100%); opacity:0 } }
        @keyframes fadeIn    { from { opacity:0; transform:scale(.96) }      to { opacity:1; transform:scale(1) } }
        @keyframes fadeOut   { from { opacity:1 }                            to { opacity:0 } }
      `}</style>
    </>
  );
}
