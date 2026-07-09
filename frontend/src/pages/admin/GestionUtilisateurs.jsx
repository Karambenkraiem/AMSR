import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

const ROLE_LABELS = {
  admin: 'Administrateur', charge_travaux: 'Chargé de Travaux',
  charge_consignation: 'Chargé de Consignation', charge_exploitation: 'Chargé d\'Exploitation',
  chef_centrale: 'Chef de Centrale',
  chef_maintenance: 'Chef Maintenance',
  directeur: 'Directeur',
  animateur_securite: 'Animateur Sécurité',
  responsable_securite: 'Responsable Sécurité',
  guest: 'Invité',
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800', charge_travaux: 'bg-blue-100 text-blue-800',
  charge_consignation: 'bg-yellow-100 text-yellow-800', charge_exploitation: 'bg-green-100 text-green-800',
  chef_centrale: 'bg-gray-100 text-gray-800',
  chef_maintenance: 'bg-orange-100 text-orange-800',
  directeur: 'bg-indigo-100 text-indigo-800',
  animateur_securite: 'bg-pink-100 text-pink-800',
  responsable_securite: 'bg-purple-100 text-purple-800',
  guest: 'bg-slate-100 text-slate-600',
};

const emptyForm = { nom: '', prenom: '', email: '', role: 'charge_travaux', matricule: '', centrale: 'Centrale Goulette 2', password: '', active: true };

const SORT_GETTERS = {
  utilisateur: (u) => `${u.prenom || ''} ${u.nom || ''}`.trim().toLowerCase(),
  matricule: (u) => (u.matricule || '').toLowerCase(),
  role: (u) => (ROLE_LABELS[u.role] || u.role || '').toLowerCase(),
  centrale: (u) => (u.centrale || '').toLowerCase(),
  email: (u) => (u.email || '').toLowerCase(),
  statut: (u) => (u.active ? 0 : 1),
};

const SortIcon = ({ active, direction }) => (
  <span className={`ml-1 inline-block transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
    {active && direction === 'desc' ? '▾' : '▴'}
  </span>
);

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, nom }
  const [demoModeEnabled, setDemoModeEnabled] = useState(null);
  const [demoModeSaving, setDemoModeSaving] = useState(false);
  const [sort, setSort] = useState({ key: 'utilisateur', direction: 'asc' });

  const toggleSort = (key) => {
    setSort((p) => (p.key === key ? { key, direction: p.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));
  };

  const sortedUsers = useMemo(() => {
    const getter = SORT_GETTERS[sort.key];
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...users].sort((a, b) => {
      const va = getter(a), vb = getter(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [users, sort]);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    api.get('/config/demo-mode').then((r) => setDemoModeEnabled(r.data.enabled)).catch(() => {});
  }, []);

  const toggleDemoMode = async () => {
    setDemoModeSaving(true);
    try {
      const res = await api.put('/config/demo-mode', { enabled: !demoModeEnabled });
      setDemoModeEnabled(res.data.enabled);
    } catch {
      alert('Erreur lors de la mise à jour du mode démo');
    } finally {
      setDemoModeSaving(false);
    }
  };

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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/users/${confirmDelete.id}`);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
      setConfirmDelete(null);
    }
  };

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <button onClick={openCreate} className="btn-primary">+ Nouvel utilisateur</button>
      </div>

      {/* Mode démonstration */}
      <div className="card flex items-center justify-between border-l-4 border-amber-400">
        <div>
          <div className="font-semibold text-gray-800">🎯 Mode démonstration</div>
          <p className="text-sm text-gray-500 mt-0.5 max-w-xl">
            Affiche sur la page de connexion un bouton par compte réel actif — connexion en un clic,
            <strong className="text-amber-700"> sans mot de passe</strong>, pour n'importe quel utilisateur.
            À activer uniquement pendant une présentation, puis à désactiver juste après.
          </p>
        </div>
        <button
          onClick={toggleDemoMode}
          disabled={demoModeEnabled === null || demoModeSaving}
          className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${demoModeEnabled ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
          title={demoModeEnabled ? 'Désactiver le mode démo' : 'Activer le mode démo'}
        >
          <span
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${demoModeEnabled ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  {[
                    ['utilisateur', 'Utilisateur'],
                    ['matricule', 'Matricule'],
                    ['role', 'Rôle'],
                    ['centrale', 'Centrale'],
                    ['email', 'Email'],
                    ['statut', 'Statut'],
                  ].map(([key, label]) => (
                    <th key={key} className="pb-3 pr-4 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="group flex items-center hover:text-gray-800 transition-colors"
                      >
                        {label}
                        <SortIcon active={sort.key === key} direction={sort.direction} />
                      </button>
                    </th>
                  ))}
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-steg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">{u.prenom?.[0]}{u.nom?.[0]}</div>
                        <div className="font-medium text-gray-900">{u.prenom} {u.nom}</div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm font-semibold text-gray-700">{u.matricule || '—'}</td>
                    <td className="py-3 pr-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{u.centrale}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(u)} className="text-xs text-steg-primary hover:underline">Modifier</button>
                        <button onClick={() => handleToggle(u)} className={`text-xs hover:underline ${u.active ? 'text-orange-500' : 'text-green-600'}`}>
                          {u.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: u.id, nom: `${u.prenom} ${u.nom}` })}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Supprimer
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer définitivement ${confirmDelete?.nom} ? Toutes ses demandes et données associées seront également supprimées. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {modal === 'form' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-5">{editId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Identifiants de connexion */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Identifiants de connexion</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Matricule *</label>
                    <input
                      required
                      className="input-field font-mono"
                      value={form.matricule}
                      onChange={(e) => setForm((p) => ({ ...p, matricule: e.target.value.toUpperCase() }))}
                      placeholder="Ex: CT001"
                    />
                  </div>
                  <div>
                    <label className="label">Mot de passe {editId ? '(vide = inchangé)' : '*'}</label>
                    <input type="password" required={!editId} className="input-field" value={form.password} onChange={set('password')} placeholder="••••••••" />
                  </div>
                </div>
              </div>
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Prénom *</label><input required className="input-field" value={form.prenom} onChange={set('prenom')} /></div>
                <div><label className="label">Nom *</label><input required className="input-field" value={form.nom} onChange={set('nom')} /></div>
              </div>
              <div>
                <label className="label">Rôle *</label>
                <select required className="input-field" value={form.role} onChange={set('role')}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Centrale</label><input className="input-field" value={form.centrale} onChange={set('centrale')} /></div>
                <div><label className="label">Email *</label><input required type="email" className="input-field" value={form.email} onChange={set('email')} /></div>
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
