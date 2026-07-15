import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

// Groupes de statuts pour le filtre "attente" du dashboard
const ATTENTE_STATUTS = ['soumise', 'en_cours_attestation', 'accord_exploitation', 'regime_execute'];

export default function ListeDemandes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(() => {
    const f = searchParams.get('filter');
    // "attente" est un groupe, pas un statut unique → on le gère dans le filtre
    return f && f !== 'attente' ? f : '';
  });
  const [filterAttente, setFilterAttente] = useState(() => searchParams.get('filter') === 'attente');

  useEffect(() => {
    api.get('/demandes').then((res) => setDemandes(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = demandes.filter((d) => {
    const matchSearch = !search ||
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.designationOperation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterAttente
      ? ATTENTE_STATUTS.includes(d.status)
      : !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (val) => {
    setFilterAttente(false);
    setFilterStatus(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Demandes de Mise Sous Régime</h1>
        {['charge_travaux', 'admin', 'chef_maintenance', 'charge_consignation'].includes(user?.role) && (
          <Link to="/demandes/nouvelle" className="btn-primary">+ Nouvelle demande</Link>
        )}
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher par numéro ou opération..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-sm"
          />
          <select
            value={filterAttente ? 'attente' : filterStatus}
            onChange={(e) => {
              if (e.target.value === 'attente') { setFilterAttente(true); setFilterStatus(''); }
              else handleStatusChange(e.target.value);
            }}
            className="input-field max-w-xs"
          >
            <option value="">Tous les statuts</option>
            <option value="attente">En attente (toutes étapes)</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {(filterStatus || filterAttente || search) && (
            <button
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterAttente(false); }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 underline"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-gray-500 dark:text-gray-400">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 pr-4 font-medium">N° Demande</th>
                  <th className="pb-3 pr-4 font-medium">Désignation de l'opération</th>
                  <th className="pb-3 pr-4 font-medium">Régime</th>
                  <th className="pb-3 pr-4 font-medium">Chargé de Travaux</th>
                  <th className="pb-3 pr-4 font-medium">Date soumission</th>
                  <th className="pb-3 pr-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map((d) => {
                  const isAssistant = user && d.assistantChargeTravauxId === user.id && d.chargeTravaux?.id !== user.id;
                  return (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/demandes/${d.id}`)}
                    className="hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-mono font-semibold text-steg-primary dark:text-blue-300">{d.numero}</div>
                      {isAssistant && (
                        <div className="text-xs text-purple-600 dark:text-purple-300 font-medium mt-0.5">Assistant CT</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 max-w-xs">
                      <div className="truncate text-gray-700 dark:text-gray-300" title={d.designationOperation}>{d.designationOperation}</div>
                      {d.serviceDemandeur && <div className="text-xs text-gray-400 dark:text-gray-500">{d.serviceDemandeur}</div>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 text-xs">{REGIME_LABELS[d.regimeType]}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{d.chargeTravaux?.prenom} {d.chargeTravaux?.nom}</td>
                    <td className="py-3 pr-4 text-gray-400 dark:text-gray-500 whitespace-nowrap">{format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge-${d.status}`}>{STATUT_LABELS[d.status]}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
