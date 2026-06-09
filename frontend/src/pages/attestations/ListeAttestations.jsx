import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';

const STATUT_LABELS = {
  soumise: 'Soumise', en_cours_attestation: 'Attestation en cours',
  accord_exploitation: 'Accord exploitation', regime_execute: 'Régime exécuté',
  en_cours: 'En cours', arret_temporaire: 'Arrêt temporaire',
  operation_terminee: 'Opération terminée', cloturee: 'Clôturée', rejetee: 'Rejetée',
};

export default function ListeAttestations() {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/attestations').then((res) => setAttestations(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = attestations.filter((a) => {
    const matchSearch = !search || a.numero.toLowerCase().includes(search.toLowerCase()) ||
      a.demande?.designationOperation?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attestations de Mise Sous Régime</h1>

      <div className="card">
        <div className="flex gap-4 mb-6">
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field max-w-sm" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field max-w-xs">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12"><div className="text-5xl mb-3">📄</div><p className="text-gray-500">Aucune attestation trouvée</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pr-4 font-medium">N° Attestation</th>
                  <th className="pb-3 pr-4 font-medium">Désignation de l'opération</th>
                  <th className="pb-3 pr-4 font-medium">Chargé de Travaux</th>
                  <th className="pb-3 pr-4 font-medium">Accord Exploitation</th>
                  <th className="pb-3 pr-4 font-medium">Régime Levé</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono font-semibold text-steg-primary">{a.numero}</td>
                    <td className="py-3 pr-4 max-w-xs truncate text-gray-700">{a.demande?.designationOperation}</td>
                    <td className="py-3 pr-4 text-gray-600">{a.demande?.chargeTravaux?.prenom} {a.demande?.chargeTravaux?.nom}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {a.accordDate ? <span className="text-green-600">✓ {format(new Date(a.accordDate), 'dd/MM/yyyy')}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {a.regimeleveDate ? <span className="text-gray-600">✓ {format(new Date(a.regimeleveDate), 'dd/MM/yyyy')}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 pr-4"><span className={`badge-${a.status}`}>{STATUT_LABELS[a.status]}</span></td>
                    <td className="py-3">
                      <Link to={`/demandes/${a.demandeId}`} className="text-steg-primary hover:underline text-xs font-medium">Voir dossier</Link>
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
