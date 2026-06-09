import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLE_LABELS = {
  charge_exploitation: "Chargé d'Exploitation",
  charge_consignation: 'Chargé de Consignation',
  charge_travaux: 'Chargé de Travaux',
};

const STATUS_BADGE = (d) => {
  const now = new Date();
  if (!d.active) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">Révoquée</span>;
  if (new Date(d.dateFin) < now) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">Expirée</span>;
  if (new Date(d.dateDebut) > now) return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Planifiée</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-semibold">Active</span>;
};

const emptyForm = {
  delegueId: '',
  role: 'charge_exploitation',
  dateDebut: '',
  dateFin: '',
  note: '',
};

export default function GestionDelegations() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/delegations'), api.get('/users')])
      .then(([dRes, uRes]) => {
        setDelegations(dRes.data);
        setUsers(uRes.data.filter((u) => u.active && u.id !== user.id));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/delegations', form);
      setShowForm(false);
      setForm(emptyForm);
      fetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Révoquer cette délégation ?')) return;
    try {
      await api.patch(`/delegations/${id}/revoquer`);
      fetch();
    } catch { alert('Erreur'); }
  };

  const now = new Date();
  const isActive = (d) => d.active && new Date(d.dateDebut) <= now && new Date(d.dateFin) >= now;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Délégations de rôle</h1>
          <p className="text-sm text-gray-500 mt-1">
            Désignez temporairement des agents pour agir en votre nom avec votre rôle.
          </p>
        </div>
        {['charge_exploitation', 'admin', 'chef_centrale'].includes(user.role) && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Nouvelle délégation</button>
        )}
      </div>

      {/* Indicateur délégation active sur l'utilisateur courant */}
      {user.delegatedRoles?.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl">🔑</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm">Délégation active sur votre compte</div>
            <div className="text-sm text-amber-700">
              Vous agissez actuellement avec le(s) rôle(s) délégué(s) :
              <strong> {user.delegatedRoles.map((r) => ROLE_LABELS[r] || r).join(', ')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Nouvelle délégation</h3>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Agent à déléguer *</label>
                <select required className="input-field" value={form.delegueId} onChange={set('delegueId')}>
                  <option value="">— Sélectionner un agent —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.prenom} {u.nom} — {u.role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Rôle délégué *</label>
                <select required className="input-field" value={form.role} onChange={set('role')}>
                  <option value="charge_exploitation">Chargé d'Exploitation</option>
                  <option value="charge_consignation">Chargé de Consignation</option>
                  <option value="charge_travaux">Chargé de Travaux</option>
                </select>
              </div>
              <div>
                <label className="label">Date et heure de début *</label>
                <input required type="datetime-local" className="input-field" value={form.dateDebut} onChange={set('dateDebut')} />
              </div>
              <div>
                <label className="label">Date et heure de fin *</label>
                <input required type="datetime-local" className="input-field" value={form.dateFin} onChange={set('dateFin')} />
              </div>
            </div>
            <div>
              <label className="label">Note (optionnel)</label>
              <input className="input-field" value={form.note} onChange={set('note')} placeholder="Raison ou contexte..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }} className="btn-outline">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Création...' : 'Créer la délégation'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      <div className="card">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Chargement...</div>
        ) : delegations.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Aucune délégation créée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pr-4 font-medium">Délégant</th>
                  <th className="pb-3 pr-4 font-medium">Délégué</th>
                  <th className="pb-3 pr-4 font-medium">Rôle</th>
                  <th className="pb-3 pr-4 font-medium">Du</th>
                  <th className="pb-3 pr-4 font-medium">Au</th>
                  <th className="pb-3 pr-4 font-medium">Note</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {delegations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{d.delegant?.prenom} {d.delegant?.nom}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{d.delegue?.prenom} {d.delegue?.nom}</div>
                      <div className="text-xs text-gray-400">{d.delegue?.role?.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                        {ROLE_LABELS[d.role] || d.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs whitespace-nowrap">
                      {format(new Date(d.dateDebut), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs whitespace-nowrap">
                      {format(new Date(d.dateFin), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{d.note || '—'}</td>
                    <td className="py-3 pr-4">{STATUS_BADGE(d)}</td>
                    <td className="py-3">
                      {(isActive(d) || (d.active && new Date(d.dateDebut) > now)) && (
                        d.delegantId === user.id || user.role === 'admin'
                      ) && (
                        <button onClick={() => handleRevoke(d.id)} className="text-xs text-red-500 hover:underline">
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
