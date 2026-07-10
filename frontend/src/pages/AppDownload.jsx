import React, { useEffect, useState } from 'react';
import { getMobileOS, APK_URL, APPSTORE_URL, IOS_AVAILABLE } from '../utils/mobileDetect';

// Page publique servant de cible au QR code affiché sur l'écran de connexion.
// Ouverte depuis un téléphone Android (via scan), elle lance directement le
// téléchargement de l'APK. Ouverte depuis un desktop ou un iPhone (iOS pas
// encore disponible), elle affiche les options disponibles.
export default function AppDownload() {
  const [os] = useState(getMobileOS());

  useEffect(() => {
    if (os === 'android') window.location.replace(APK_URL);
  }, [os]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-steg-dark to-steg-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8">
        <div className="w-16 h-16 bg-steg-primary rounded-full mx-auto flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-lg font-bold text-gray-800 mb-2">Application AMSR — STEG</h1>

        {os === 'android' && (
          <p className="text-sm text-gray-500">Téléchargement en cours…</p>
        )}
        {os === 'ios' && (
          <p className="text-sm text-gray-500 mb-4">
            L'application iOS n'est pas encore disponible. Revenez bientôt !
          </p>
        )}
        {os === null && (
          <p className="text-sm text-gray-500 mb-4">
            Ouvrez ce lien depuis votre téléphone (ou scannez le code QR sur la page de connexion) pour installer l'application.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {os !== 'ios' && (
            <a
              href={APK_URL}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors text-sm font-bold"
            >
              Télécharger pour Android
            </a>
          )}
          {IOS_AVAILABLE ? (
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-bold"
            >
              Disponible sur l'App Store
            </a>
          ) : (
            <span className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed">
              Bientôt sur l'App Store
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
