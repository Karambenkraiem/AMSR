import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'amsr_app_banner_dismissed';

// Liens à mettre à jour après publication sur les stores
const LINKS = {
  android: 'https://play.google.com/store/apps/details?id=tn.steg.amsr',
  ios: 'https://apps.apple.com/app/amsr-steg/id000000000',
  // Lien APK direct (à héberger sur le serveur) :
  apk: 'https://amsr.alkaramsoft.ovh/download/amsr-steg.apk',
};

function getMobileOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  return null;
}

export default function MobileAppBanner() {
  const [visible, setVisible] = useState(false);
  const [os, setOs] = useState(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const detectedOs = getMobileOS();
    if (detectedOs) {
      setOs(detectedOs);
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const isAndroid = os === 'android';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-200 shadow-2xl">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Icône app */}
        <div className="w-12 h-12 rounded-xl bg-steg-primary flex items-center justify-center shrink-0 shadow">
          <span className="text-white font-bold text-xl">S</span>
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">AMSR — STEG</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">
            {isAndroid ? 'Disponible sur Google Play' : 'Disponible sur l\'App Store'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {['★','★','★','★','★'].map((s, i) => (
              <span key={i} className="text-yellow-400 text-xs">{s}</span>
            ))}
          </div>
        </div>

        {/* Bouton télécharger */}
        <a
          href={isAndroid ? LINKS.android : LINKS.ios}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-steg-primary text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-900 transition-colors"
          onClick={dismiss}
        >
          {isAndroid ? '↓ Installer' : '↓ Obtenir'}
        </a>

        {/* Fermer */}
        <button
          onClick={dismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
