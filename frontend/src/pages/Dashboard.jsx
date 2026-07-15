import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUT_LABELS = {
  soumise: 'Soumise',
  en_cours_attestation: 'Attestation en cours',
  accord_exploitation: 'Accord exploitation',
  regime_execute: 'Régime exécuté',
  en_cours: 'En cours',
  arret_temporaire: 'Arrêt temporaire',
  operation_terminee: 'Opération terminée',
  cloturee: 'Clôturée',
  rejetee: 'Rejetée',
};

const StatCard = ({ label, value, color, icon, onClick }) => (
  <div
    onClick={onClick}
    className={`card flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 select-none`}
  >
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/demandes').then((res) => setDemandes(res.data)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: demandes.length,
    enCours: demandes.filter((d) => d.status === 'en_cours').length,
    attente: demandes.filter((d) => ['soumise', 'en_cours_attestation', 'accord_exploitation', 'regime_execute'].includes(d.status)).length,
    arret: demandes.filter((d) => d.status === 'arret_temporaire').length,
  };

  const recent = demandes.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Bienvenue, {user?.prenom} {user?.nom}</p>
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500">{format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total demandes"  value={stats.total}   color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"   icon="📋" onClick={() => navigate('/demandes')} />
        <StatCard label="En attente"       value={stats.attente} color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300" icon="⏳" onClick={() => navigate('/demandes?filter=attente')} />
        <StatCard label="En cours"         value={stats.enCours} color="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300"  icon="⚙️" onClick={() => navigate('/demandes?filter=en_cours')} />
        <StatCard label="Arrêts temp."     value={stats.arret}   color="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"      icon="⏸️" onClick={() => navigate('/demandes?filter=arret_temporaire')} />
      </div>

      {/* Recent demandes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Demandes récentes</h2>
          <Link to="/demandes" className="text-sm text-steg-primary dark:text-blue-300 hover:underline">Voir tout →</Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">Chargement...</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune demande pour l'instant</p>
            {['charge_travaux', 'admin'].includes(user?.role) && (
              <Link to="/demandes/nouvelle" className="btn-primary inline-block mt-4 text-sm">Créer une demande</Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">N°</th>
                  <th className="pb-3 font-medium">Opération</th>
                  <th className="pb-3 font-medium">Régime</th>
                  <th className="pb-3 font-medium">Chargé Travaux</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {recent.map((d) => {
                  const isAssistant = user && d.assistantChargeTravauxId === user.id && d.chargeTravaux?.id !== user.id;
                  return (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/demandes/${d.id}`)}
                    className="hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3">
                      <div className="font-mono font-medium text-steg-primary dark:text-blue-300">{d.numero}</div>
                      {isAssistant && <div className="text-xs text-purple-600 dark:text-purple-300 font-medium">Assistant CT</div>}
                    </td>
                    <td className="py-3 max-w-xs truncate text-gray-700 dark:text-gray-300">{d.designationOperation}</td>
                    <td className="py-3 capitalize text-gray-600 dark:text-gray-400">{d.regimeType?.replace('_', ' ')}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{d.chargeTravaux?.prenom} {d.chargeTravaux?.nom}</td>
                    <td className="py-3 text-gray-400 dark:text-gray-500">{format(new Date(d.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="py-3">
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
