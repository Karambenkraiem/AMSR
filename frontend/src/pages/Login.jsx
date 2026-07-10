import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getMobileOS, isNativeApp, APK_URL, APPSTORE_URL, IOS_AVAILABLE } from '../utils/mobileDetect';

const ROLE_META = {
  admin:                 { label: 'Administrateur',       color: 'bg-red-600',     icon: '🛡️' },
  charge_travaux:        { label: 'Chargé Travaux',       color: 'bg-orange-500',  icon: '🔧' },
  charge_consignation:   { label: 'Chargé Consignation',  color: 'bg-green-600',   icon: '🔒' },
  charge_exploitation:   { label: 'Chargé Exploitation',  color: 'bg-blue-600',    icon: '⚡' },
  chef_centrale:         { label: 'Chef de Centrale',     color: 'bg-purple-600',  icon: '👷' },
  chef_maintenance:      { label: 'Chef Maintenance',     color: 'bg-teal-600',    icon: '🛠️' },
  directeur:             { label: 'Directeur',            color: 'bg-indigo-600',  icon: '🧭' },
  animateur_securite:    { label: 'Animateur Sécurité',   color: 'bg-pink-600',    icon: '🦺' },
  responsable_securite:  { label: 'Responsable Sécurité', color: 'bg-fuchsia-700', icon: '🛡️' },
  guest:                 { label: 'Invité',               color: 'bg-slate-500',   icon: '👁️' },
};

const QR_MODAL_DISMISS_KEY = 'amsr_qr_modal_dismissed';

function QrDownloadModal({ onClose }) {
  const downloadUrl = `${window.location.origin}/app`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Fermer"
        >
          ×
        </button>
        <p className="text-sm font-bold text-gray-800 mb-1">Application mobile STEG</p>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Scannez pour installer</p>
        <div className="inline-block p-2 bg-white border border-gray-200 rounded-xl">
          <QRCodeSVG value={downloadUrl} size={160} />
        </div>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          Ouvrez l'appareil photo de votre téléphone
          <br />
          et scannez ce code (Android / iOS)
        </p>
      </div>
    </div>
  );
}

function AppDownloadSection() {
  const os = getMobileOS();
  const isDesktop = os === null;
  const native = isNativeApp();
  const [showQrModal, setShowQrModal] = useState(false);

  // Sur desktop, propose automatiquement le QR code au chargement de la page
  // (une seule fois par session pour ne pas être intrusif).
  useEffect(() => {
    if (native || !isDesktop) return;
    if (sessionStorage.getItem(QR_MODAL_DISMISS_KEY)) return;
    setShowQrModal(true);
  }, [native, isDesktop]);

  const closeQrModal = () => {
    sessionStorage.setItem(QR_MODAL_DISMISS_KEY, '1');
    setShowQrModal(false);
  };

  // Ne pas afficher si l'utilisateur est déjà dans l'app native Capacitor
  if (native) return null;

  // Sur desktop (Chrome/Edge...), un lien de téléchargement direct ne sert à
  // rien : on propose une popup avec un QR code à scanner avec un téléphone.
  if (isDesktop) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span>📱</span>
          Télécharger l'application mobile
        </button>
        {showQrModal && <QrDownloadModal onClose={closeQrModal} />}
      </div>
    );
  }

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium text-center mb-3 uppercase tracking-wide">
        Application mobile STEG
      </p>

      <div className="flex gap-2 flex-col">
        {/* Android */}
        {os === 'android' && (
          <a
            href={APK_URL}
            className="flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors flex-1"
          >
            {/* Google Play icon */}
            <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="currentColor">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.45-11.7-2.76-2.76L3.18 23.76zm17.29-12.21c.32-.29.53-.7.53-1.17s-.2-.88-.52-1.17L18.3 7.8l-3.07 3.07 3.07 3.07 2.17-2.39zM2.01 1.05C1.7 1.35 1.5 1.8 1.5 2.37v19.26c0 .57.2 1.02.51 1.32l.07.06L13.15 12 2.08.99l-.07.06zm11.1 10.59L2.08 23.67l.06.06c.3.28.7.43 1.1.38.29-.04.56-.16.79-.32L16.48 15.8l-3.37-4.16z"/>
            </svg>
            <div>
              <div className="text-xs text-gray-400 leading-none">Télécharger pour</div>
              <div className="text-sm font-bold leading-tight">Android</div>
            </div>
            <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">APK</span>
          </a>
        )}

        {/* iOS */}
        {os === 'ios' && (
          IOS_AVAILABLE ? (
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {/* Apple icon */}
              <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div className="text-xs leading-none text-gray-400">Disponible sur</div>
                <div className="text-sm font-bold leading-tight">App Store</div>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl flex-1 bg-gray-100 text-gray-400 cursor-not-allowed">
              {/* Apple icon */}
              <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <div className="text-xs leading-none">Bientôt sur</div>
                <div className="text-sm font-bold leading-tight">App Store</div>
              </div>
              <span className="ml-auto text-xs bg-gray-300 text-gray-500 px-2 py-0.5 rounded-full">Bientôt</span>
            </div>
          )
        )}
      </div>

      {os === 'android' && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Activer "Sources inconnues" dans Paramètres &rsaquo; Sécurité si demandé
        </p>
      )}
    </div>
  );
}

export default function Login() {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [quickUsers, setQuickUsers] = useState([]);
  const [demoLoading, setDemoLoading] = useState(null);
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/config/demo-mode')
      .then((res) => setDemoModeEnabled(!!res.data.enabled))
      .catch(() => setDemoModeEnabled(false));
  }, []);

  useEffect(() => {
    if (!demoModeEnabled) { setQuickUsers([]); return; }
    api.get('/config/quick-access-users')
      .then((res) => setQuickUsers(res.data))
      .catch(() => setQuickUsers([]));
  }, [demoModeEnabled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(matricule, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const loginAsUser = async (u) => {
    setDemoLoading(u.id);
    setError('');
    try {
      await quickLogin(u.id);
      navigate('/');
    } catch {
      setError('Connexion démo indisponible.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-steg-dark to-steg-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-steg-primary p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-steg-primary font-bold text-3xl">S</span>
          </div>
          <h1 className="text-white text-2xl font-bold">STEG</h1>
          <p className="text-blue-200 text-sm mt-1">Système de Gestion AMSR</p>
          <p className="text-blue-100 text-xs mt-1">Attestation de Mise Sous Régime</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Matricule</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                className="input-field"
                placeholder="ADM001"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Section démo */}
          {demoModeEnabled && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDemoOpen(o => !o)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  Accès démo — cliquez pour tester
                </span>
                <span className={`transition-transform duration-200 ${demoOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {demoOpen && (
                <div className="mt-3 max-h-72 overflow-y-auto grid grid-cols-3 gap-2 pr-1">
                  {quickUsers.length === 0 && (
                    <div className="col-span-3 text-xs text-gray-400 text-center py-4">Aucun compte disponible</div>
                  )}
                  {quickUsers.map(u => {
                    const meta = ROLE_META[u.role] || { label: u.role, color: 'bg-gray-500', icon: '👤' };
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => loginAsUser(u)}
                        disabled={demoLoading !== null}
                        className={`${meta.color} hover:opacity-90 text-white rounded-xl px-2 py-3 text-left transition-opacity disabled:opacity-60`}
                      >
                        <div className="text-lg mb-0.5">{meta.icon}</div>
                        <div className="text-[11px] font-bold leading-tight truncate">{u.prenom} {u.nom}</div>
                        <div className="text-[9px] opacity-80 leading-tight">{meta.label}</div>
                        {demoLoading === u.id && (
                          <div className="text-[10px] opacity-80 mt-0.5">Connexion...</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <AppDownloadSection />
        </div>
      </div>
    </div>
  );
}
