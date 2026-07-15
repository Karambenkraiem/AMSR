import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';

const MIN_ROWS = 8;
const emptyRow = () => ({ repere: '', instruction: '', local: '', etat: '' });

const ETAT_OPTIONS = [
  { value: '',   desc: '' },
  { value: 'CD', desc: 'Condamné Débroché' },
  { value: 'CF', desc: 'Condamné Fermé' },
  { value: 'CO', desc: 'Condamné Ouvert' },
  { value: "D'", desc: 'Dispo. Débroché' },
  { value: "F'", desc: 'Dispo. Fermé' },
  { value: "O'", desc: 'Dispo. Ouvert' },
  { value: "E'", desc: 'Dispo. Embroché' },
  { value: "C'", desc: 'Dispo. Condamné' },
  { value: 'MC', desc: 'Ouvrage concerné' },
];

function EtatSelect({ value, onChange, tabIndex }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (v) => { onChange(v); setOpen(false); };
  const current = ETAT_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative w-full h-full" tabIndex={tabIndex}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((p) => !p); if (e.key === 'Escape') setOpen(false); }}>
      {/* Cellule affichée */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full h-full flex items-center justify-center gap-1 px-1 py-1 text-sm font-mono font-semibold hover:bg-blue-50 transition-colors"
      >
        <span>{value || <span className="text-gray-300 font-normal text-xs">—</span>}</span>
        <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Panneau déroulant */}
      {open && (
        <div className="absolute z-50 bottom-full mb-0.5 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded shadow-lg overflow-hidden no-print"
             style={{ minWidth: '220px' }}>
          {ETAT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => select(o.value)}
              className={`w-full flex items-center px-2 py-1.5 text-sm text-gray-900 hover:bg-blue-600 hover:text-white transition-colors text-left
                ${o.value === value ? 'bg-blue-100 font-semibold' : ''}`}
            >
              <span className="font-mono font-bold w-8 shrink-0 text-center">{o.value || '—'}</span>
              <span className="mx-2 opacity-40">|</span>
              <span>{o.desc || 'Aucun'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const padRows = (rows) => {
  const filled = rows || [];
  return filled.length >= MIN_ROWS
    ? filled
    : [...filled, ...Array.from({ length: MIN_ROWS - filled.length }, emptyRow)];
};

const SigBlock = ({ title, user, date }) => (
  <div>
    <div className="text-center text-xs font-bold uppercase py-1 mb-1"
         style={{ background: '#2d2d2d', color: '#fff' }}>{title}</div>
    <table className="w-full border-collapse text-xs">
      <tbody>
        <tr>
          <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">J</td>
          <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">M</td>
          <td className="border border-gray-700 text-center font-bold py-0.5 w-1/2">H</td>
        </tr>
        <tr>
          <td className="border border-gray-700 text-center py-1">{date ? format(new Date(date), 'dd') : ''}</td>
          <td className="border border-gray-700 text-center py-1">{date ? format(new Date(date), 'MM') : ''}</td>
          <td className="border border-gray-700 text-center py-1">{date ? format(new Date(date), 'HH:mm') : ''}</td>
        </tr>
        <tr>
          <td className="border border-gray-700 font-bold py-0.5 px-1">NOM</td>
          <td className="border border-gray-700 font-bold py-0.5 px-1" colSpan={2}>VISA</td>
        </tr>
        <tr>
          <td className="border border-gray-700 py-2 px-1">
            {user ? `${user.prenom} ${user.nom}` : ''}
          </td>
          <td className="border border-gray-700 py-2" colSpan={2}></td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default function RemplirAttestation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    codeBdm: '',
    ouvrageDesignation: '',
    local: '',
    repere: '',
    manoeuvresCondamnation: '',
    instructions: padRows([]),
    serviceDemandeur: '',
    permisFeu: false,
    permisFouille: false,
    permisControleRadio: false,
    permisAcces: false,
  });

  useEffect(() => {
    api.get(`/demandes/${id}`)
      .then((res) => {
        setDemande(res.data);
        if (res.data.attestation) {
          const a = res.data.attestation;
          setForm({
            codeBdm: a.codeBdm || '',
            ouvrageDesignation: a.ouvrageDesignation || '',
            local: a.local || '',
            repere: a.repere || '',
            manoeuvresCondamnation: a.manoeuvresCondamnation || '',
            instructions: padRows(a.instructions),
            serviceDemandeur: res.data.serviceDemandeur || '',
            permisFeu: a.permisFeu || false,
            permisFouille: a.permisFouille || false,
            permisControleRadio: a.permisControleRadio || false,
            permisAcces: a.permisAcces || false,
          });
        }
      })
      .catch(() => navigate('/demandes'))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (f) => (e) =>
    setForm((p) => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const updateRow = (i, field, value) =>
    setForm((p) => ({
      ...p,
      instructions: p.instructions.map((row, idx) => idx === i ? { ...row, [field]: value } : row),
    }));

  const clearRow = (i) =>
    setForm((p) => ({
      ...p,
      instructions: p.instructions.map((row, idx) => idx === i ? emptyRow() : row),
    }));

  const addRow = () =>
    setForm((p) => ({ ...p, instructions: [...p.instructions, emptyRow()] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        // Ne sauvegarder que les lignes qui ont au moins un champ rempli
        instructions: form.instructions.filter(
          (r) => r.repere || r.instruction || r.local || r.etat
        ),
      };
      if (demande.attestation) {
        await api.put(`/attestations/${demande.attestation.id}`, payload);
      } else {
        await api.post(`/demandes/${id}/attestation`, payload);
      }
      navigate(`/demandes/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-steg-primary"></div>
    </div>
  );
  if (!demande) return null;

  const att = demande.attestation;
  const d = demande;
  const datePrevu = d.datePrevu ? new Date(d.datePrevu) : null;
  const border = 'border border-gray-800';
  const labelSm = 'text-xs font-bold uppercase text-gray-700';
  const inp = 'w-full bg-transparent outline-none text-sm text-gray-900';
  const darkHeader = { background: '#2d2d2d', color: '#fff' };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Barre d'actions */}
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(`/demandes/${id}`)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">← Retour au dossier</button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {att ? 'Modifier l\'Attestation' : 'Remplir l\'Attestation'} — {d.numero}
          </h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/demandes/${id}`)} className="btn-outline text-sm">Annuler</button>
          <button form="att-form" type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Enregistrement...' : 'Enregistrer l\'attestation'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

      <form id="att-form" onSubmit={handleSubmit}>
        <div className="bg-white border-2 border-gray-800" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>

          {/* ══ EN-TÊTE ══ */}
          <div className="flex">
            <div className={`${border} border-t-0 border-l-0 p-2`} style={{ width: '28%' }}>
              <div className={labelSm}>STEG / C.P. — Centrale de :</div>
              <div className="font-semibold text-gray-900 mt-1">{d.centrale}</div>
            </div>
            <div className={`${border} border-t-0 flex-1 p-2`}>
              <div className="text-center text-base font-bold uppercase tracking-wide text-gray-900 mb-1">
                ATTESTATION DE MISE SOUS RÉGIME
              </div>
              <div className="flex gap-6 justify-center text-xs">
                <span className="flex items-center gap-1">
                  <input type="checkbox" readOnly checked={d.typeBon === 'travail'} className="w-3 h-3" />
                  Suite au Bon de Travail N° : <strong>{d.typeBon === 'travail' ? d.numeroBon : ''}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <input type="checkbox" readOnly checked={d.typeBon === 'visite_systematique'} className="w-3 h-3" />
                  Suite au Bon de Visite systématique N° : <strong>{d.typeBon === 'visite_systematique' ? d.numeroBon : ''}</strong>
                </span>
              </div>
            </div>
            <div className={`${border} border-t-0 border-r-0 p-2 flex items-center justify-center`} style={{ width: '12%' }}>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">N°</div>
                <div className="text-base font-bold text-steg-primary">{d.numero}</div>
              </div>
            </div>
          </div>

          {/* ══ CORPS : 2 COLONNES ══ */}
          <div className="flex border-t border-gray-800">

            {/* ── COLONNE GAUCHE (60%) ── */}
            <div style={{ width: '60%' }} className="border-r border-gray-800">

              <div className={`${border} border-l-0 border-t-0 border-b p-2 flex items-center gap-2`}>
                <span className={labelSm}>RÉGIME DEMANDÉ PAR : </span>
                <select
                  value={form.serviceDemandeur}
                  onChange={set('serviceDemandeur')}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 border-b border-gray-400 cursor-pointer"
                >
                  <option value="">— Sélectionner —</option>
                  <option value="Service Mécanique">Service Mécanique</option>
                  <option value="Service Électrique">Service Électrique</option>
                  <option value="Service Instrumentation & Contrôle commande CC">Service Instrumentation &amp; Contrôle commande CC</option>
                  <option value="Prestation">Prestation</option>
                </select>
              </div>

              <div className={`${border} border-l-0 border-t-0 border-b p-2`}>
                <div className={`${labelSm} mb-1`}>DÉSIGNATION DE L'OPÉRATION :</div>
                <div className="text-sm text-gray-800">{d.designationOperation}</div>
              </div>

              {/* Localisation + Ouvrage */}
              <div className="flex border-b border-gray-800">
                <div className={`${border} border-l-0 border-t-0 border-b-0 p-2`} style={{ width: '35%' }}>
                  <div className={`${labelSm} mb-1`}>LOCALISATION</div>
                  <table className="w-full border-collapse text-xs">
                    <thead><tr>
                      <th className="border border-gray-700 px-1 py-0.5 text-center bg-gray-50 w-1/4">TR</th>
                      <th className="border border-gray-700 px-1 py-0.5 text-center bg-gray-50 w-1/4">TG</th>
                      <th className="border border-gray-700 px-1 py-0.5 text-center bg-gray-50">NIVEAU (m)</th>
                    </tr></thead>
                    <tbody><tr>
                      <td className="border border-gray-700 text-center py-1">{d.tr || '—'}</td>
                      <td className="border border-gray-700 text-center py-1">{d.tg || '—'}</td>
                      <td className="border border-gray-700 text-center py-1">{d.niveau || '—'}</td>
                    </tr></tbody>
                  </table>
                </div>
                <div className="flex-1 p-2 border-l border-gray-800">
                  <div className={`${labelSm} mb-1`}>OUVRAGE CONCERNÉ</div>
                  <table className="w-full border-collapse text-xs">
                    <thead><tr>
                      <th className="border border-gray-700 px-1 py-0.5 text-center bg-gray-50 w-1/3">CODE BDM</th>
                      <th className="border border-gray-700 px-1 py-0.5 text-center bg-gray-50">DÉSIGNATION</th>
                    </tr></thead>
                    <tbody><tr>
                      <td className="border border-gray-700 p-0.5">
                        <input value={form.codeBdm} onChange={set('codeBdm')} className={inp} placeholder="Code BDM" />
                      </td>
                      <td className="border border-gray-700 p-0.5">
                        <input value={form.ouvrageDesignation} onChange={set('ouvrageDesignation')} className={inp} placeholder="Désignation" />
                      </td>
                    </tr></tbody>
                  </table>
                </div>
              </div>

              {/* Local + Date + Durée + Service */}
              <div className="flex border-b border-gray-800">
                <div className={`${border} border-l-0 border-t-0 border-b-0 p-2`} style={{ width: '18%' }}>
                  <div className={`${labelSm} mb-1`}>LOCAL</div>
                  <input value={form.local} onChange={set('local')} className={inp} placeholder="Local" />
                </div>
                <div className="border-l border-gray-800 p-2" style={{ width: '30%' }}>
                  <div className={`${labelSm} mb-1`}>DATE PRÉVUE</div>
                  <table className="border-collapse text-xs">
                    <thead><tr>
                      <th className="border border-gray-700 px-2 py-0.5 text-center bg-gray-50 w-8">J</th>
                      <th className="border border-gray-700 px-2 py-0.5 text-center bg-gray-50 w-8">M</th>
                      <th className="border border-gray-700 px-2 py-0.5 text-center bg-gray-50 w-10">H</th>
                    </tr></thead>
                    <tbody><tr>
                      <td className="border border-gray-700 text-center py-1">{datePrevu ? format(datePrevu, 'dd') : ''}</td>
                      <td className="border border-gray-700 text-center py-1">{datePrevu ? format(datePrevu, 'MM') : ''}</td>
                      <td className="border border-gray-700 text-center py-1">{datePrevu ? format(datePrevu, 'HH:mm') : ''}</td>
                    </tr></tbody>
                  </table>
                </div>
                <div className="border-l border-gray-800 p-2" style={{ width: '22%' }}>
                  <div className={`${labelSm} mb-1`}>DURÉE PRÉVUE</div>
                  <div className="text-sm text-gray-700">{d.dureePrevu || '—'}</div>
                </div>
                <div className="border-l border-gray-800 p-2 flex-1">
                  <div className={`${labelSm} mb-1`}>SERVICE OU ENTREPRISE</div>
                  <select
                    value={form.serviceDemandeur}
                    onChange={set('serviceDemandeur')}
                    className="w-full bg-transparent outline-none text-sm text-gray-900 cursor-pointer"
                  >
                    <option value="">— Sélectionner —</option>
                    <option value="Service Mécanique">Service Mécanique</option>
                    <option value="Service Électrique">Service Électrique</option>
                    <option value="Service Instrumentation & Contrôle commande CC">Service Instrumentation &amp; Contrôle commande CC</option>
                    <option value="Prestation">Prestation</option>
                  </select>
                </div>
              </div>

              {/* ═══ TABLEAU DES INSTRUCTIONS ═══ */}
              <div className="p-0">
                <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th className="border border-gray-700 px-2 py-1 text-center bg-gray-100 font-bold" style={{ width: '15%' }}>REPÈRE</th>
                      <th className="border border-gray-700 px-2 py-1 text-left bg-gray-100 font-bold">INSTRUCTIONS</th>
                      <th className="border border-gray-700 px-2 py-1 text-center bg-gray-100 font-bold" style={{ width: '11%' }}>LOCAL</th>
                      <th className="border border-gray-700 px-2 py-1 text-center bg-gray-100 font-bold" style={{ width: '11%' }}>ÉTAT</th>
                      {/* Colonne action visible seulement à l'écran */}
                      <th className="border border-gray-700 bg-gray-100 no-print" style={{ width: '28px' }}></th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Ligne Manœuvres de condamnation */}
                    <tr>
                      <td colSpan={4} className="border border-gray-700 px-2 py-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!form.manoeuvresCondamnation.trim()}
                            onChange={(e) => setForm((p) => ({ ...p, manoeuvresCondamnation: e.target.checked ? (p.manoeuvresCondamnation || '') : '' }))}
                            className="w-3 h-3 shrink-0"
                          />
                          <span className="font-medium whitespace-nowrap">Manœuvres de condamnation suivant fiche jointe N° :</span>
                          <input
                            value={form.manoeuvresCondamnation}
                            onChange={set('manoeuvresCondamnation')}
                            className="border-b border-gray-500 outline-none flex-1 px-1 bg-transparent"
                            placeholder="numéro de fiche"
                          />
                        </label>
                      </td>
                      <td className="border border-gray-700 no-print"></td>
                    </tr>

                    {/* Lignes de saisie directe */}
                    {form.instructions.map((row, i) => {
                      const hasContent = row.repere || row.instruction || row.local || row.etat;
                      return (
                        <tr key={i} className="group hover:bg-blue-50 transition-colors">
                          <td className="border border-gray-700 p-0" style={{ height: '26px' }}>
                            <input
                              value={row.repere}
                              onChange={(e) => updateRow(i, 'repere', e.target.value)}
                              className="w-full h-full bg-transparent outline-none px-2 py-1 text-sm"
                              tabIndex={i * 4 + 1}
                            />
                          </td>
                          <td className="border border-gray-700 p-0">
                            <input
                              value={row.instruction}
                              onChange={(e) => updateRow(i, 'instruction', e.target.value)}
                              className="w-full h-full bg-transparent outline-none px-2 py-1 text-sm"
                              tabIndex={i * 4 + 2}
                            />
                          </td>
                          <td className="border border-gray-700 p-0">
                            <input
                              value={row.local}
                              onChange={(e) => updateRow(i, 'local', e.target.value)}
                              className="w-full h-full bg-transparent outline-none px-2 py-1 text-sm text-center"
                              tabIndex={i * 4 + 3}
                            />
                          </td>
                          <td className="border border-gray-700 p-0" style={{ overflow: 'visible' }}>
                            <EtatSelect
                              value={row.etat}
                              onChange={(v) => updateRow(i, 'etat', v)}
                              tabIndex={i * 4 + 4}
                            />
                          </td>
                          {/* Bouton effacer ligne (visible seulement au hover si contenu) */}
                          <td className="border border-gray-700 text-center no-print" style={{ width: '28px' }}>
                            {hasContent && (
                              <button
                                type="button"
                                onClick={() => clearRow(i)}
                                title="Effacer la ligne"
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 font-bold leading-none transition-opacity"
                                style={{ fontSize: '16px' }}
                              >×</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Bouton ajouter une ligne */}
                <div className="flex justify-end px-1 py-1 border-l border-r border-b border-gray-700 no-print">
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 text-xs text-steg-primary hover:text-steg-dark font-semibold"
                  >
                    <span className="text-lg leading-none font-bold">+</span>
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                {/* Légende */}
                <div className="px-2 py-1 border-l border-r border-b border-gray-700 text-xs text-gray-500">
                  <span className="font-semibold">Légende : </span>
                  CD=Condamné Débroché | CF=Condamné Fermé | CO=Condamné Ouvert |
                  D'=Dispo. Débroché | F'=Dispo. Fermé | O'=Dispo. Ouvert |
                  E'=Dispo. Embroché | C'=Dispo. Condamné | MC=Ouvrage concerné
                </div>
              </div>
            </div>

            {/* ── COLONNE DROITE (40%) ── */}
            <div style={{ width: '40%' }} className="flex flex-col">

              {/* Type de régime */}
              <div className="border-b border-gray-800 p-2">
                <div className={`${labelSm} mb-2`}>TYPE DE RÉGIME :</div>
                {[
                  { v: 'consignation', l: 'CONSIGNATION (RC)' },
                  { v: 'exceptionnel_travaux', l: 'EXCEPTIONNEL DE TRAVAUX (RET)' },
                  { v: 'essais', l: 'ESSAIS (RE)' },
                  { v: 'requisition', l: 'RÉQUISITION (RR)' },
                  { v: 'interventions', l: 'INTERVENTIONS (RI)' },
                ].map((r) => (
                  <label key={r.v} className="flex items-center gap-2 mb-1">
                    <input type="checkbox" readOnly checked={d.regimeType === r.v} className="w-3 h-3" />
                    <span className={`text-xs ${d.regimeType === r.v ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{r.l}</span>
                  </label>
                ))}
              </div>

              {/* Documents joints */}
              <div className="border-b border-gray-800 p-2">
                <div className={`${labelSm} mb-2`}>DOCUMENTS JOINTS :</div>
                {[
                  { k: 'permisFeu', l: 'PERMIS DE FEU' },
                  { k: 'permisFouille', l: 'PERMIS DE FOUILLE' },
                  { k: 'permisControleRadio', l: 'PERMIS DE CONTRÔLE RADIO' },
                  { k: 'permisAcces', l: "PERMIS D'ACCÈS" },
                ].map(({ k, l }) => (
                  <label key={k} className="flex items-center gap-2 mb-1 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={set(k)} className="w-3 h-3 accent-gray-800" />
                    <span className="text-xs">{l}</span>
                  </label>
                ))}
              </div>

              {/* Blocs signatures */}
              <div className="flex-1 p-2 space-y-2">
                <SigBlock title="ACCORD — CHARGÉ D'EXPLOITATION" user={att?.accordExploitation} date={att?.accordDate} />
                <SigBlock title="RÉGIME EXÉCUTÉ — CHARGÉ DE CONSIGNATION" user={att?.regimeExecute} date={att?.regimeExecuteDate} />

                <div>
                  <div className="text-center text-xs font-bold uppercase py-1 mb-1" style={darkHeader}>
                    RÉGIME DÉLIVRÉ — CHARGÉ DE TRAVAUX
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">J</td>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">M</td>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/2">H</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 text-center py-1">{att?.regimeDelivreDate ? format(new Date(att.regimeDelivreDate), 'dd') : ''}</td>
                        <td className="border border-gray-700 text-center py-1">{att?.regimeDelivreDate ? format(new Date(att.regimeDelivreDate), 'MM') : ''}</td>
                        <td className="border border-gray-700 text-center py-1">{att?.regimeDelivreDate ? format(new Date(att.regimeDelivreDate), 'HH:mm') : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 font-bold py-0.5 px-1">NOM</td>
                        <td className="border border-gray-700 font-bold py-0.5 px-1" colSpan={2}>VISA</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 py-2 px-1">{att?.regimeDelivre ? `${att.regimeDelivre.prenom} ${att.regimeDelivre.nom}` : ''}</td>
                        <td className="border border-gray-700 py-2" colSpan={2}></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 py-1 px-1 text-xs italic" colSpan={3}>
                          Assistant : {att?.assistantDelivreNom || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className="text-center text-xs font-bold uppercase py-1 mb-1" style={darkHeader}>
                    OPÉRATION TERMINÉE
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">J</td>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/4">M</td>
                        <td className="border border-gray-700 text-center font-bold py-0.5 w-1/2">H</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 text-center py-1">{att?.operationTermineeDate ? format(new Date(att.operationTermineeDate), 'dd') : ''}</td>
                        <td className="border border-gray-700 text-center py-1">{att?.operationTermineeDate ? format(new Date(att.operationTermineeDate), 'MM') : ''}</td>
                        <td className="border border-gray-700 text-center py-1">{att?.operationTermineeDate ? format(new Date(att.operationTermineeDate), 'HH:mm') : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 font-bold py-0.5 px-1">NOM</td>
                        <td className="border border-gray-700 font-bold py-0.5 px-1" colSpan={2}>VISA</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 py-2 px-1">{att?.operationTerminee ? `${att.operationTerminee.prenom} ${att.operationTerminee.nom}` : ''}</td>
                        <td className="border border-gray-700 py-2" colSpan={2}></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 py-1 px-1 text-xs italic" colSpan={3}>
                          Assistant : {att?.assistantTermineeNom || ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <SigBlock title="RÉGIME LEVÉ — CHARGÉ DE CONSIGNATION" user={att?.regimeLeve} date={att?.regimeleveDate} />
              </div>
            </div>
          </div>
        </div>

        {/* Boutons bas */}
        <div className="flex gap-3 justify-end mt-4 no-print">
          <button type="button" onClick={() => navigate(`/demandes/${id}`)} className="btn-outline">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary px-8">
            {saving ? 'Enregistrement...' : 'Enregistrer l\'attestation'}
          </button>
        </div>
      </form>
    </div>
  );
}
