import React, { useState, useEffect } from 'react';

const DISMISSED_KEY = 'amsr_install_dismissed_until';
const DISMISS_DAYS = 7;
const APK_URL = 'https://amsr.alkaramsoft.ovh/download/amsr-steg.apk';
const IOS_URL  = 'https://apps.apple.com/app/amsr-steg/id000000000';

function detectOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/ipad|iphone|ipod/i.test(ua) && !window.MSStream) return 'ios';
  return 'desktop';
}

function isDismissed() {
  const until = localStorage.getItem(DISMISSED_KEY);
  return until && Date.now() < Number(until);
}

export default function AppInstallPrompt() {
  const [show, setShow]   = useState(false);
  const [os, setOs]       = useState('desktop');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.Capacitor?.isNativePlatform?.()) return;
    if (isDismissed()) return;
    const t = setTimeout(() => { setOs(detectOS()); setShow(true); }, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    const until = Date.now() + DISMISS_DAYS * 86400_000;
    localStorage.setItem(DISMISSED_KEY, String(until));
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  const isAndroid = os === 'android';
  const isIos     = os === 'ios';
  const isMobile  = isAndroid || isIos;

  return (
    <>
      {/* Overlay semi-transparent (mobile seulement) */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-[9998]"
          style={{ animation: leaving ? 'fadeOut .3s forwards' : 'fadeIn .3s forwards' }}
          onClick={dismiss}
        />
      )}

      {/* La carte */}
      <div
        className={`fixed z-[9999] bg-white shadow-2xl ${
          isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-2xl'
            : 'bottom-5 right-5 w-80 rounded-2xl border border-gray-100'
        }`}
        style={{ animation: leaving
          ? (isMobile ? 'slideDown .3s forwards' : 'fadeOut .3s forwards')
          : (isMobile ? 'slideUp .35s ease-out forwards' : 'fadeIn .35s forwards')
        }}
      >
        {/* Poignée (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#003366] flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-black text-2xl">S</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-base leading-tight">AMSR — STEG</p>
              <p className="text-xs text-gray-500 mt-0.5">Application de Mise Sous Régime</p>
              <div className="flex gap-0.5 mt-1.5">
                {[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {isMobile
              ? 'Installez l\'application STEG sur votre téléphone pour un accès rapide et hors-ligne.'
              : 'Accédez à AMSR depuis votre smartphone — disponible pour Android et iOS.'}
          </p>

          {/* Boutons */}
          <div className={`flex gap-3 ${isMobile && !isAndroid && !isIos ? 'flex-row' : 'flex-col'}`}>

            {/* Android */}
            {(!isIos) && (
              <a
                href={APK_URL}
                onClick={dismiss}
                className="flex items-center gap-3 bg-gray-900 hover:bg-gray-700 text-white px-4 py-3 rounded-xl transition-colors flex-1"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 fill-white">
                  <path d="M3.18 23.76c.3.17.64.24.99.2l12.45-11.7-2.76-2.76L3.18 23.76zm17.29-12.21c.32-.29.53-.7.53-1.17s-.2-.88-.52-1.17L18.3 7.8l-3.07 3.07 3.07 3.07 2.17-2.39zM2.01 1.05C1.7 1.35 1.5 1.8 1.5 2.37v19.26c0 .57.2 1.02.51 1.32l.07.06L13.15 12 2.08.99l-.07.06zm11.1 10.59L2.08 23.67l.06.06c.3.28.7.43 1.1.38.29-.04.56-.16.79-.32L16.48 15.8l-3.37-4.16z"/>
                </svg>
                <div>
                  <div className="text-[10px] text-gray-400 leading-none uppercase tracking-wide">
                    {isAndroid ? 'Télécharger le fichier APK' : 'Android'}
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    {isAndroid ? 'Installer maintenant' : 'Télécharger APK'}
                  </div>
                </div>
              </a>
            )}

            {/* iOS */}
            {(!isAndroid) && (
              <a
                href={IOS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={!isIos ? undefined : dismiss}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors flex-1 ${
                  isIos
                    ? 'bg-gray-900 hover:bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                <svg viewBox="0 0 24 24" className={`w-6 h-6 shrink-0 ${isIos ? 'fill-white' : 'fill-gray-400'}`}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div className={`text-[10px] leading-none uppercase tracking-wide ${isIos ? 'text-gray-400' : 'text-gray-400'}`}>
                    {isIos ? 'Disponible sur' : 'iOS — Bientôt'}
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    App Store
                  </div>
                </div>
                {!isIos && (
                  <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Bientôt</span>
                )}
              </a>
            )}
          </div>

          {isMobile && (
            <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
              {isAndroid
                ? 'Activez « Sources inconnues » dans Paramètres › Sécurité si demandé'
                : 'Publiée prochainement sur l\'App Store'}
            </p>
          )}

          <button onClick={dismiss} className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-500">
            Non merci, continuer sur le site
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp   { from { transform: translateY(100%); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes slideDown { from { transform: translateY(0); opacity:1 } to { transform: translateY(100%); opacity:0 } }
        @keyframes fadeIn    { from { opacity:0; transform:scale(.97) } to { opacity:1; transform:scale(1) } }
        @keyframes fadeOut   { from { opacity:1 } to { opacity:0 } }
      `}</style>
    </>
  );
}
