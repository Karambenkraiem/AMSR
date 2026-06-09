import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
    } finally {
      setLoading(false);
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
              <label className="label">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="votre.email@steg.com.tn"
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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-2">Comptes de démonstration :</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div>admin@steg.com.tn — Admin</div>
              <div>ctravaux@steg.com.tn — Chargé Travaux</div>
              <div>cconsignation@steg.com.tn — Chargé Consignation</div>
              <div>cexploitation@steg.com.tn — Chargé Exploitation</div>
              <div className="text-gray-400 mt-1">Mot de passe: Admin@2024</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
