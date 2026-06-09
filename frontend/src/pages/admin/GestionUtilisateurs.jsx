import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ROLE_LABELS = {
  admin: 'Administrateur', charge_travaux: 'Chargé de Travaux',
  charge_consignation: 'Chargé de Consignation', charge_exploitation: 'Chargé d\'Exploitation',
  assistant_charge_exploitation: 'Assistant C. Exploitation', chef_centrale: 'Chef de Centrale',
  chef_maintenance: 'Chef Maintenance',
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800', charge_travaux: 'bg-blue-100 text-blue-800',
  charge_consignation: 'bg-yellow-100 text-yellow-800', charge_exploitation: 'bg-green-100 text-green-800',
  assistant_charge_exploitation: 'bg-purple-100 text-purple-800', chef_centrale: 'bg-gray-100 text-gray-800',
  chef_maintenance: 'bg-orange-100 text-orange-800',
};

const emptyForm = { nom: '', prenom: '', email: '', role: 'charge_travaux', matricule: '', centrale: 'Centrale Goulette 2', password: '', active: true };

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setError(''); setModal('form'); };
  const openEdit = (u) => {
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, role: u.role, matricule: u.matricule || '', centrale: u.centrale, password: '', active: u.active });
    setEditId(u.id); setError(''); setModal('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editId) { await api.put(`/users/${editId}`, data); }
      else { await api.post('/users', data); }
      fetchUsers(); setModal(null);
    } catch (err) { setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    try { await api.put(`/users/${u.id}`, { active: !u.active }); fetchUsers(); }
    catch { alert('Erreur'); }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <button onClick={openCreate} className="btn-primary">+ Nouvel utilisateur</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pr-4 font-medium">Utilisateur</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Rôle</th>
                  <th className="pb-3 pr-4 font-medium">Matricule</th>
                  <th className="pb-3 pr-4 font-medium">Centrale</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-steg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">{u.prenom?.[0]}{u.nom?.[0]}</div>
                        <div><div className="font-medium text-gray-900">{u.prenom} {u.nom}</div></div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                    <td className="py-3 pr-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{u.matricule || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{u.centrale}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="text-xs text-steg-primary hover:underline">Modifier</button>
                        <button onClick={() => handleToggle(u)} className={`text-xs hover:underline ${u.active ? 'text-red-500' : 'text-green-600'}`}>
                          {u.active ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-5">{editId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Prénom *</label><input required className="input-field" value={form.prenom} onChange={set('prenom')} /></div>
                <div><label className="label">Nom *</label><input required className="input-field" value={form.nom} onChange={set('nom')} /></div>
              </div>
              <div><label className="label">Email *</label><input required type="email" className="input-field" value={form.email} onChange={set('email')} /></div>
              <div><label className="label">Mot de passe {editId ? '(laisser vide pour ne pas changer)' : '*'}</label><input type="password" required={!editId} className="input-field" value={form.password} onChange={set('password')} placeholder="••••••••" /></div>
              <div>
                <label className="label">Rôle *</label>
                <select required className="input-field" value={form.role} onChange={set('role')}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Matricule</label><input className="input-field" value={form.matricule} onChange={set('matricule')} placeholder="Ex: CT001" /></div>
                <div><label className="label">Centrale</label><input className="input-field" value={form.centrale} onChange={set('centrale')} /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
