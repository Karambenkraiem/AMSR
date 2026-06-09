import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function NouvelleDemande() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ctUsers, setCtUsers] = useState([]);

  useEffect(() => {
    api.get('/users').then((r) => {
      setCtUsers(r.data.filter((u) => u.active && u.role === 'charge_travaux'));
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    designationOperation: '',
    tr: '', tg: '', niveau: '',
    ouvragesConcernes: '',
    dateJ: '', dateM: '', dateA: '', dateH: '',
    dureePrevu: '',
    instructionsParticulieres: '',
    typeBon: '',
    numeroBon: '',
    regimeType: '',
    serviceDemandeur: '',
    assistantId: '',
    permisFeu: false,
    permisControle: false,
    permisAcces: false,
    permisRadiographique: false,
    permisFouille: false,
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.regimeType) { setError('Veuillez sélectionner un type de régime'); return; }
    if (!form.designationOperation) { setError('La désignation de l\'opération est obligatoire'); return; }
    setError('');
    setLoading(true);
    try {
      const datePrevu = (form.dateJ && form.dateM && form.dateA && form.dateH)
        ? new Date(`${form.dateA}-${form.dateM.padStart(2,'0')}-${form.dateJ.padStart(2,'0')}T${form.dateH}`)
        : null;
      const res = await api.post('/demandes', {
        designationOperation: form.designationOperation,
        tr: form.tr, tg: form.tg, niveau: form.niveau,
        ouvragesConcernes: form.ouvragesConcernes,
        datePrevu: datePrevu?.toISOString() || null,
        dureePrevu: form.dureePrevu,
        instructionsParticulieres: form.instructionsParticulieres,
        typeBon: form.typeBon || null,
        numeroBon: form.numeroBon,
        regimeType: form.regimeType,
        serviceDemandeur: form.serviceDemandeur,
        assistantId: form.assistantId || null,
        permisFeu: form.permisFeu,
        permisControle: form.permisControle,
        permisAcces: form.permisAcces,
        permisRadiographique: form.permisRadiographique,
        permisFouille: form.permisFouille,
      });
      navigate(`/demandes/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const cellStyle = 'border border-gray-800';
  const labelStyle = 'text-xs font-bold text-gray-700 uppercase';
  const inputStyle = 'w-full bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 px-1 py-0.5';
  const checkboxRow = 'flex items-center gap-2 mb-1';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page title */}
      <div className="flex items-center justify-between mb-4 no-print">
        <h1 className="text-xl font-bold text-gray-800">Nouvelle Demande de Mise Sous Régime</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline text-sm">Annuler</button>
          <button form="dmsr-form" type="submit" disabled={loading} className="btn-primary text-sm">
            {loading ? 'Soumission...' : 'Soumettre la demande'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {/* FORMULAIRE PAPIER */}
      <form id="dmsr-form" onSubmit={handleSubmit}>
        <div className="bg-white border-2 border-gray-800 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>

          {/* ── LIGNE 1 : En-tête ── */}
          <div className="flex border-b border-gray-800">
            {/* Centrale */}
            <div className={`${cellStyle} p-2 border-t-0 border-l-0`} style={{ width: '30%' }}>
              <div className={labelStyle}>STEG / C.P. — Centrale de :</div>
              <div className="mt-1 font-semibold text-gray-900">{user?.centrale}</div>
            </div>
            {/* Titre + type bon */}
            <div className="flex-1 p-3 border-l border-gray-800">
              <div className="text-center text-base font-bold uppercase tracking-wide text-gray-900 mb-2">
                DEMANDE DE MISE SOUS RÉGIME
              </div>
              <div className="flex flex-col gap-1">
                <label className={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.typeBon === 'travail'}
                    onChange={(e) => setForm((f) => ({ ...f, typeBon: e.target.checked ? 'travail' : '' }))}
                    className="w-4 h-4 accent-gray-800"
                  />
                  <span className="text-xs font-medium">Suite au Bon de Travail N° :</span>
                  {form.typeBon === 'travail' && (
                    <input
                      value={form.numeroBon} onChange={set('numeroBon')}
                      className="border-b border-gray-600 outline-none text-xs w-32 px-1"
                      placeholder="numéro"
                    />
                  )}
                </label>
                <label className={checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.typeBon === 'visite_systematique'}
                    onChange={(e) => setForm((f) => ({ ...f, typeBon: e.target.checked ? 'visite_systematique' : '' }))}
                    className="w-4 h-4 accent-gray-800"
                  />
                  <span className="text-xs font-medium">Suite au Bon de Visite systématique N° :</span>
                  {form.typeBon === 'visite_systematique' && (
                    <input
                      value={form.numeroBon} onChange={set('numeroBon')}
                      className="border-b border-gray-600 outline-none text-xs w-32 px-1"
                      placeholder="numéro"
                    />
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* ── LIGNE 2 : Désignation de l'opération ── */}
          <div className={`${cellStyle} border-t-0 border-l-0 border-r-0 p-2`}>
            <div className={labelStyle}>Désignation de l'opération :</div>
            <textarea
              value={form.designationOperation}
              onChange={set('designationOperation')}
              required
              rows={3}
              className={`${inputStyle} resize-none mt-1 w-full`}
              placeholder="Description détaillée de l'opération..."
            />
          </div>

          {/* ── LIGNE 3 : Localisation + Ouvrages ── */}
          <div className="flex border-t border-gray-800">
            {/* Localisation */}
            <div className={`${cellStyle} border-t-0 border-l-0 p-2`} style={{ width: '30%' }}>
              <div className={`${labelStyle} mb-2`}>LOCALISATION :</div>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-700 px-2 py-1 font-bold text-center bg-gray-50 w-1/3">TR</th>
                    <th className="border border-gray-700 px-2 py-1 font-bold text-center bg-gray-50 w-1/3">TG</th>
                    <th className="border border-gray-700 px-2 py-1 font-bold text-center bg-gray-50">NIVEAU (m)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-700">
                      <input value={form.tr} onChange={set('tr')} className={`${inputStyle} text-center`} placeholder="—" />
                    </td>
                    <td className="border border-gray-700">
                      <input value={form.tg} onChange={set('tg')} className={`${inputStyle} text-center`} placeholder="—" />
                    </td>
                    <td className="border border-gray-700">
                      <input value={form.niveau} onChange={set('niveau')} className={`${inputStyle} text-center`} placeholder="—" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Ouvrages concernés */}
            <div className="flex-1 border-l border-gray-800 p-2">
              <div className={`${labelStyle} mb-1`}>OUVRAGES CONCERNÉS :</div>
              <textarea
                value={form.ouvragesConcernes}
                onChange={set('ouvragesConcernes')}
                rows={3}
                className={`${inputStyle} resize-none w-full`}
                placeholder="Liste des ouvrages concernés..."
              />
            </div>
          </div>

          {/* ── LIGNE 4 : Demandé pour le + Durée ── */}
          <div className="flex border-t border-gray-800">
            {/* Date J M A H */}
            <div className={`${cellStyle} border-t-0 border-l-0 p-2`} style={{ width: '55%' }}>
              <div className={`${labelStyle} mb-2`}>Demandé pour le :</div>
              <div className="flex items-center gap-1">
                <table className="border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-gray-700 px-3 py-1 font-bold text-center bg-gray-50 w-12">J</th>
                      <th className="border border-gray-700 px-3 py-1 font-bold text-center bg-gray-50 w-12">M</th>
                      <th className="border border-gray-700 px-3 py-1 font-bold text-center bg-gray-50 w-16">A</th>
                      <th className="border border-gray-700 px-3 py-1 font-bold text-center bg-gray-50 w-16">H</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-700">
                        <input
                          value={form.dateJ} onChange={set('dateJ')}
                          className={`${inputStyle} text-center w-12`}
                          placeholder="JJ" maxLength={2}
                        />
                      </td>
                      <td className="border border-gray-700">
                        <input
                          value={form.dateM} onChange={set('dateM')}
                          className={`${inputStyle} text-center w-12`}
                          placeholder="MM" maxLength={2}
                        />
                      </td>
                      <td className="border border-gray-700">
                        <input
                          value={form.dateA} onChange={set('dateA')}
                          className={`${inputStyle} text-center w-16`}
                          placeholder="AAAA" maxLength={4}
                        />
                      </td>
                      <td className="border border-gray-700">
                        <input
                          type="time"
                          value={form.dateH} onChange={set('dateH')}
                          className={`${inputStyle} text-center w-20`}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Durée prévue */}
            <div className="flex-1 border-l border-gray-800 p-2">
              <div className={`${labelStyle} mb-1`}>Durée prévue de l'opération :</div>
              <input
                value={form.dureePrevu} onChange={set('dureePrevu')}
                className={inputStyle}
                placeholder="Ex : 4 heures"
              />
            </div>
          </div>

          {/* ── LIGNE 5 : Instructions particulières ── */}
          <div className={`${cellStyle} border-t border-gray-800 border-l-0 border-r-0 p-2`}>
            <div className={`${labelStyle} mb-1`}>Instructions particulières :</div>
            <textarea
              value={form.instructionsParticulieres}
              onChange={set('instructionsParticulieres')}
              rows={3}
              className={`${inputStyle} resize-none w-full`}
              placeholder="Instructions de sécurité ou remarques particulières..."
            />
          </div>

          {/* ── LIGNE 6 : Documents + Signatures + Régime ── */}
          <div className="flex border-t border-gray-800">

            {/* Documents associés */}
            <div className={`${cellStyle} border-t-0 border-l-0 p-3`} style={{ width: '28%' }}>
              <div className={`${labelStyle} mb-2`}>Document(s) associé(s) à la mise sous régime :</div>
              <div className="space-y-2">
                {[
                  { key: 'permisFeu', label: 'Permis de feu' },
                  { key: 'permisControle', label: 'Permis de contrôle' },
                  { key: 'permisAcces', label: "Permis d'accès" },
                  { key: 'permisRadiographique', label: 'Permis radiographique' },
                  { key: 'permisFouille', label: 'Permis de fouille' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={set(key)}
                      className="w-4 h-4 accent-gray-800"
                    />
                    <span className="text-xs">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Signatures */}
            <div className={`${cellStyle} border-t-0 p-3`} style={{ width: '37%' }}>
              <div className="mb-4">
                <div className={`${labelStyle} mb-1`}>Assistant Chargé de Travaux :</div>
                <select
                  value={form.assistantId}
                  onChange={set('assistantId')}
                  className="w-full border border-gray-400 rounded px-2 py-1 text-sm bg-white outline-none focus:border-steg-primary"
                >
                  <option value="">— Aucun assistant —</option>
                  {ctUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom}{u.matricule ? ` (${u.matricule})` : ''}
                      </option>
                    ))}
                </select>
                {form.assistantId && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span>🔔</span>
                    <span>L'assistant recevra une notification à la soumission.</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-300">
                <div className={`${labelStyle} mb-1`}>Nom et visa du Chargé de Travaux :</div>
                <div className="text-sm font-semibold text-gray-800 mt-1">
                  {user?.prenom} {user?.nom}
                </div>
                <div className="text-xs text-gray-500">{user?.matricule || '—'}</div>
              </div>
            </div>

            {/* Régime + Service demandeur */}
            <div className="flex-1 border-l border-gray-800 p-3">
              <div className={`${labelStyle} mb-2`}>RÉGIME DE : <span className="text-red-600">*</span></div>
              <div className="space-y-2">
                {[
                  { value: 'consignation', label: 'CONSIGNATION' },
                  { value: 'exceptionnel_travaux', label: 'EXCEPTIONNEL DE TRAVAUX' },
                  { value: 'essais', label: 'ESSAIS' },
                  { value: 'requisition', label: 'RÉQUISITION' },
                  { value: 'interventions', label: 'INTERVENTIONS' },
                ].map((r) => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.regimeType === r.value}
                      onChange={() => setForm((f) => ({ ...f, regimeType: f.regimeType === r.value ? '' : r.value }))}
                      className="w-4 h-4 accent-gray-800"
                    />
                    <span className={`text-xs font-medium ${form.regimeType === r.value ? 'text-steg-primary font-bold' : ''}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-300">
                <div className={`${labelStyle} mb-1`}>Service demandeur :</div>
                <input
                  value={form.serviceDemandeur} onChange={set('serviceDemandeur')}
                  className={`${inputStyle} border-b border-gray-400 pb-1`}
                  placeholder="Nom du service"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Boutons bas de page */}
        <div className="flex gap-3 justify-end mt-4 no-print">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary px-8">
            {loading ? 'Soumission en cours...' : 'Soumettre la demande'}
          </button>
        </div>
      </form>
    </div>
  );
}
