import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function MonCompte() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [pwdForm, setPwdForm] = useState({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true); setProfileError(''); setProfileSuccess('');
    try {
      const res = await api.put('/auth/me', profileForm);
      updateUser(res.data);
      setProfileSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwdForm.nouveauMotDePasse !== pwdForm.confirmation) {
      setPwdError('La confirmation ne correspond pas au nouveau mot de passe');
      return;
    }
    setPwdSaving(true);
    try {
      await api.put('/auth/change-password', {
        ancienMotDePasse: pwdForm.ancienMotDePasse,
        nouveauMotDePasse: pwdForm.nouveauMotDePasse,
      });
      setPwdSuccess('Mot de passe modifié avec succès');
      setPwdForm({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmation: '' });
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon compte</h1>

      {/* Informations personnelles */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Informations personnelles</h2>
        {profileError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{profileError}</div>}
        {profileSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{profileSuccess}</div>}
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom *</label>
              <input required className="input-field" value={profileForm.prenom} onChange={(e) => setProfileForm((p) => ({ ...p, prenom: e.target.value }))} />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input required className="input-field" value={profileForm.nom} onChange={(e) => setProfileForm((p) => ({ ...p, nom: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <input required type="email" className="input-field" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Matricule</label>
            <input disabled className="input-field bg-gray-50 text-gray-400" value={user?.matricule || ''} />
            <p className="text-xs text-gray-400 mt-1">Le matricule (identifiant de connexion) ne peut être modifié que par un administrateur.</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileSaving} className="btn-primary">{profileSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>
        {pwdError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{pwdError}</div>}
        {pwdSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{pwdSuccess}</div>}
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="label">Mot de passe actuel *</label>
            <input required type="password" className="input-field" value={pwdForm.ancienMotDePasse} onChange={(e) => setPwdForm((p) => ({ ...p, ancienMotDePasse: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nouveau mot de passe *</label>
              <input required type="password" className="input-field" value={pwdForm.nouveauMotDePasse} onChange={(e) => setPwdForm((p) => ({ ...p, nouveauMotDePasse: e.target.value }))} />
            </div>
            <div>
              <label className="label">Confirmation *</label>
              <input required type="password" className="input-field" value={pwdForm.confirmation} onChange={(e) => setPwdForm((p) => ({ ...p, confirmation: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pwdSaving} className="btn-primary">{pwdSaving ? 'Enregistrement...' : 'Changer le mot de passe'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
