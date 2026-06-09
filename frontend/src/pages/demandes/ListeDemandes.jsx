import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const STATUT_LABELS = {
  soumise: 'Soumise', en_cours_attestation: 'Attestation en cours',
  accord_exploitation: 'Accord exploitation', regime_execute: 'Régime exécuté',
  en_cours: 'En cours', arret_temporaire: 'Arrêt temporaire',
  operation_terminee: 'Opération terminée', cloturee: 'Clôturée', rejetee: 'Rejetée',
};

const REGIME_LABELS = {
  consignation: 'Consignation', exceptionnel_travaux: 'Exceptionnel Travaux',
  essais: 'Essais', requisition: 'Réquisition', interventions: 'Interventions',
};

export default function ListeDemandes() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/demandes').then((res) => setDemandes(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = demandes.filter((d) => {
    const matchSearch = !search || d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.designationOperation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Demandes de Mise Sous Régime</h1>
        {['charge_travaux', 'admin'].includes(user?.role) && (
          <Link to="/demandes/nouvelle" className="btn-primary">+ Nouvelle demande</Link>
        )}
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par numéro ou opération..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-sm"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field max-w-xs">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pr-4 font-medium">N° Demande</th>
                  <th className="pb-3 pr-4 font-medium">Désignation de l'opération</th>
                  <th className="pb-3 pr-4 font-medium">Régime</th>
                  <th className="pb-3 pr-4 font-medium">Chargé de Travaux</th>
                  <th className="pb-3 pr-4 font-medium">Date soumission</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-mono font-semibold text-steg-primary">{d.numero}</span>
                    </td>
                    <td className="py-3 pr-4 max-w-xs">
                      <div className="truncate text-gray-700" title={d.designationOperation}>{d.designationOperation}</div>
                      {d.serviceDemandeur && <div className="text-xs text-gray-400">{d.serviceDemandeur}</div>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs">{REGIME_LABELS[d.regimeType]}</td>
                    <td className="py-3 pr-4 text-gray-600">{d.chargeTravaux?.prenom} {d.chargeTravaux?.nom}</td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge-${d.status}`}>{STATUT_LABELS[d.status]}</span>
                    </td>
                    <td className="py-3">
                      <Link to={`/demandes/${d.id}`} className="text-steg-primary hover:underline text-xs font-medium">Voir détail</Link>
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
