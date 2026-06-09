import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import DemandePDF from '../../components/pdf/DemandePDF';
import AttestationPDF from '../../components/pdf/AttestationPDF';

const STATUT_LABELS = {
  soumise: 'Soumise', en_cours_attestation: 'Attestation en cours',
  accord_exploitation: 'Accord exploitation', regime_execute: 'Régime exécuté',
  attente_confirmation_assistant: 'Attente confirmation assistant',
  en_cours: 'En cours', arret_temporaire: 'Arrêt temporaire',
  operation_terminee: 'Opération terminée', cloturee: 'Clôturée', rejetee: 'Rejetée',
};

const REGIME_LABELS = {
  consignation: 'Consignation (RC)', exceptionnel_travaux: 'Exceptionnel de Travaux (RET)',
  essais: 'Essais (RE)', requisition: 'Réquisition (RR)', interventions: 'Interventions (RI)',
};

const SectionTitle = ({ children }) => (
  <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">{children}</h3>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
    <div className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">—</span>}</div>
  </div>
);

const Checkbox = ({ checked, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${checked ? 'bg-steg-primary border-steg-primary' : 'border-gray-300'}`}>
      {checked && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </div>
);

const WorkflowStep = ({ number, label, done, active, date, user: stepUser }) => (
  <div className={`flex items-start gap-3 ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${done ? 'bg-green-500 text-white' : active ? 'bg-steg-primary text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
      {done ? '✓' : number}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${done ? 'text-green-700' : active ? 'text-steg-primary' : 'text-gray-500'}`}>{label}</div>
      {done && stepUser && <div className="text-xs text-gray-400 mt-0.5">{stepUser.prenom} {stepUser.nom} — {date && format(new Date(date), 'dd/MM/yyyy HH:mm')}</div>}
    </div>
  </div>
);

export default function DetailDemande() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({});

  const demandePrintRef = useRef();
  const attestationPrintRef = useRef();

  const printDemande = useReactToPrint({ content: () => demandePrintRef.current });
  const printAttestation = useReactToPrint({ content: () => attestationPrintRef.current });

  const fetchDemande = async () => {
    try {
      const res = await api.get(`/demandes/${id}`);
      setDemande(res.data);
    } catch { navigate('/demandes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDemande(); }, [id]);
  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch(() => {});
  }, []);

  const doAction = async (action, extraData = {}) => {
    setActionLoading(true);
    try {
      await action(extraData);
      await fetchDemande();
      setModal(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-steg-primary"></div></div>;
  if (!demande) return null;

  const att = demande.attestation;
  const s = demande.status;
  const actAs = (role) => {
    if (user.role === 'admin' || user.role === 'chef_centrale') return true;
    if (user.role === role) return true;
    if (user.delegatedRoles?.includes(role)) return true;
    // Privilèges étendus fixes
    if (role === 'charge_travaux' && ['chef_maintenance', 'charge_consignation'].includes(user.role)) return true;
    return false;
  };

  const canConsignation = actAs('charge_consignation');
  const canExploitation = actAs('charge_exploitation');
  const isMainCT = user.id === demande.chargeTravauxId
    || user.role === 'admin'
    || user.role === 'chef_centrale'
    || user.role === 'chef_maintenance'
    || user.role === 'charge_consignation';
  const isAssistantCT = user.id === demande.assistantChargeTravauxId;
  const canTravaux = isMainCT || isAssistantCT;

  const hasAssistantStep = !!att?.assistantDelivreId;
  const assistantConfirmed = att?.regimeDelivreDate != null && ['en_cours','arret_temporaire','operation_terminee','cloturee'].includes(s);

  const workflowSteps = [
    { label: 'Demande soumise', done: true, user: demande.chargeTravaux, date: demande.createdAt },
    { label: 'Attestation remplie par chargé consignation', done: ['accord_exploitation','regime_execute','attente_confirmation_assistant','en_cours','arret_temporaire','operation_terminee','cloturee'].includes(s), user: null, date: att?.createdAt },
    { label: 'Accord du chargé d\'exploitation', done: att?.accordDate != null, user: att?.accordExploitation, date: att?.accordDate },
    { label: 'Régime exécuté (consignation OK)', done: att?.regimeExecuteDate != null, user: att?.regimeExecute, date: att?.regimeExecuteDate },
    { label: 'Régime accepté par chargé de travaux', done: att?.regimeDelivreId != null, user: att?.regimeDelivre, date: s === 'attente_confirmation_assistant' ? null : att?.regimeDelivreDate },
    ...(hasAssistantStep ? [{
      label: `Confirmation de l'assistant (${att?.assistantDelivreNom || '—'})`,
      done: assistantConfirmed,
      user: assistantConfirmed ? att?.assistantDelivre : null,
      date: assistantConfirmed ? att?.regimeDelivreDate : null,
    }] : []),
    { label: 'Travaux en cours', done: ['en_cours','arret_temporaire','operation_terminee','cloturee'].includes(s), user: null, date: att?.regimeDelivreDate },
    { label: 'Opération terminée', done: att?.operationTermineeDate != null, user: att?.operationTerminee, date: att?.operationTermineeDate },
    { label: 'Régime levé (clôture)', done: s === 'cloturee', user: att?.regimeLeve, date: att?.regimeleveDate },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/demandes" className="text-gray-400 hover:text-gray-600 text-sm">← Demandes</Link>
            <span className="text-gray-300">/</span>
            <span className="font-mono font-bold text-steg-primary text-lg">{demande.numero}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{demande.designationOperation}</h1>
          <span className={`badge-${demande.status} mt-2`}>{STATUT_LABELS[demande.status]}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={printDemande} className="btn-outline text-sm">🖨️ Imprimer Demande</button>
          {att && <button onClick={printAttestation} className="btn-outline text-sm">🖨️ Imprimer Attestation</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demande Info */}
          <div className="card">
            <SectionTitle>Informations de la demande</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Centrale" value={demande.centrale} />
              <Field label="Régime demandé" value={REGIME_LABELS[demande.regimeType]} />
              <Field label="TR" value={demande.tr} />
              <Field label="TG" value={demande.tg} />
              <Field label="Niveau (m)" value={demande.niveau} />
              <Field label="Service demandeur" value={demande.serviceDemandeur} />
              <Field label="Date prévue" value={demande.datePrevu ? format(new Date(demande.datePrevu), 'dd/MM/yyyy HH:mm') : null} />
              <Field label="Durée prévue" value={demande.dureePrevu} />
              {demande.typeBon && <Field label="Suite au bon de" value={demande.typeBon === 'travail' ? `Travail N° ${demande.numeroBon}` : `Visite systématique N° ${demande.numeroBon}`} />}
            </div>
            {demande.ouvragesConcernes && (
              <div className="mb-4"><Field label="Ouvrages concernés" value={demande.ouvragesConcernes} /></div>
            )}
            {demande.instructionsParticulieres && (
              <div className="mb-4"><Field label="Instructions particulières" value={demande.instructionsParticulieres} /></div>
            )}
            <div>
              <div className="text-xs text-gray-400 font-medium mb-2">Documents associés</div>
              <div className="grid grid-cols-2 gap-2">
                <Checkbox checked={demande.permisFeu} label="Permis de feu" />
                <Checkbox checked={demande.permisControle} label="Permis de contrôle" />
                <Checkbox checked={demande.permisAcces} label="Permis d'accès" />
                <Checkbox checked={demande.permisRadiographique} label="Permis radiographique" />
                <Checkbox checked={demande.permisFouille} label="Permis de fouille" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Field label="Chargé de Travaux" value={`${demande.chargeTravaux?.prenom} ${demande.chargeTravaux?.nom} (${demande.chargeTravaux?.matricule || '—'})`} />
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  {demande.assistantChargeTravaux ? (
                    <Field
                      label="Assistant Chargé de Travaux"
                      value={`${demande.assistantChargeTravaux.prenom} ${demande.assistantChargeTravaux.nom}${demande.assistantChargeTravaux.matricule ? ` (${demande.assistantChargeTravaux.matricule})` : ''}`}
                    />
                  ) : (
                    <div>
                      <div className="text-xs text-gray-400 font-medium mb-0.5">Assistant Chargé de Travaux</div>
                      <div className="text-sm text-gray-300 italic">Aucun assistant désigné</div>
                    </div>
                  )}
                </div>
                {canTravaux && !['cloturee', 'rejetee', 'operation_terminee'].includes(s) && (
                  <button
                    onClick={() => {
                      setFormData({ assistantId: demande.assistantChargeTravauxId?.toString() || '' });
                      setModal('assistant');
                    }}
                    className="text-xs text-steg-primary hover:underline shrink-0 mt-4"
                  >
                    {demande.assistantChargeTravaux ? '✏️ Modifier' : '+ Ajouter'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attestation */}
          {att && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Attestation de Mise Sous Régime N° {att.numero}</SectionTitle>
                {canConsignation && ['soumise','en_cours_attestation','accord_exploitation'].includes(s) && (
                  <button onClick={() => navigate(`/demandes/${id}/attestation`)} className="btn-outline text-xs">Modifier attestation</button>
                )}
              </div>

              {att.ouvrageDesignation && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Code BDM" value={att.codeBdm} />
                  <Field label="Désignation ouvrage" value={att.ouvrageDesignation} />
                  <Field label="Local" value={att.local} />
                  <Field label="Repère" value={att.repere} />
                </div>
              )}
              {att.manoeuvresCondamnation && (
                <div className="mb-4"><Field label="Manœuvres de condamnation suivant fiche N°" value={att.manoeuvresCondamnation} /></div>
              )}

              {att.instructions && att.instructions.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-400 font-medium mb-2">Instructions</div>
                  <table className="w-full text-xs border border-gray-200 rounded">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left border-b border-gray-200">Repère</th><th className="p-2 text-left border-b border-gray-200">Instruction</th><th className="p-2 border-b border-gray-200">Local</th><th className="p-2 border-b border-gray-200">État</th></tr></thead>
                    <tbody>
                      {att.instructions.map((ins, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="p-2">{ins.repere}</td>
                          <td className="p-2">{ins.instruction}</td>
                          <td className="p-2 text-center">{ins.local}</td>
                          <td className="p-2 text-center">{ins.etat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signature block */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className={`p-3 rounded-lg border ${att.accordDate ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">ACCORD — Chargé d'Exploitation</div>
                  {att.accordDate ? <><div className="text-sm font-medium text-green-700">{att.accordExploitation?.prenom} {att.accordExploitation?.nom}</div><div className="text-xs text-gray-400">{format(new Date(att.accordDate), 'dd/MM/yyyy HH:mm')}</div></> : <div className="text-xs text-gray-400 italic">En attente</div>}
                </div>
                <div className={`p-3 rounded-lg border ${att.regimeExecuteDate ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">RÉGIME EXÉCUTÉ — Chargé Consignation</div>
                  {att.regimeExecuteDate ? <><div className="text-sm font-medium text-green-700">{att.regimeExecute?.prenom} {att.regimeExecute?.nom}</div><div className="text-xs text-gray-400">{format(new Date(att.regimeExecuteDate), 'dd/MM/yyyy HH:mm')}</div></> : <div className="text-xs text-gray-400 italic">En attente</div>}
                </div>
                <div className={`p-3 rounded-lg border ${att.regimeDelivreDate ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">RÉGIME DÉLIVRÉ — Chargé Travaux</div>
                  {att.regimeDelivreDate ? (
                    <>
                      <div className="text-sm font-medium text-green-700">{att.regimeDelivre?.prenom} {att.regimeDelivre?.nom}</div>
                      {att.assistantDelivre && (
                        <div className="text-xs text-green-600 mt-0.5">Assistant : {att.assistantDelivre.prenom} {att.assistantDelivre.nom}</div>
                      )}
                      <div className="text-xs text-gray-400">{format(new Date(att.regimeDelivreDate), 'dd/MM/yyyy HH:mm')}</div>
                    </>
                  ) : <div className="text-xs text-gray-400 italic">En attente</div>}
                </div>
                <div className={`p-3 rounded-lg border ${att.operationTermineeDate ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">OPÉRATION TERMINÉE</div>
                  {att.operationTermineeDate ? <><div className="text-sm font-medium text-green-700">{att.operationTerminee?.prenom} {att.operationTerminee?.nom}</div><div className="text-xs text-gray-400">{format(new Date(att.operationTermineeDate), 'dd/MM/yyyy HH:mm')}</div></> : <div className="text-xs text-gray-400 italic">En attente</div>}
                </div>
                <div className={`p-3 rounded-lg border col-span-2 ${att.regimeleveDate ? 'border-gray-300 bg-gray-50' : 'border-dashed border-gray-200'}`}>
                  <div className="text-xs font-semibold text-gray-500 mb-1">RÉGIME LEVÉ — Chargé Consignation</div>
                  {att.regimeleveDate ? <><div className="text-sm font-medium text-gray-700">{att.regimeLeve?.prenom} {att.regimeLeve?.nom}</div><div className="text-xs text-gray-400">{format(new Date(att.regimeleveDate), 'dd/MM/yyyy HH:mm')}</div></> : <div className="text-xs text-gray-400 italic">En attente</div>}
                </div>
              </div>

              {/* Changements */}
              {att.changements?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400 font-medium mb-2">Changements de chargé</div>
                  <div className="space-y-2">
                    {att.changements.map((c) => (
                      <div key={c.id} className="text-xs text-gray-600 flex gap-3">
                        <span className="text-gray-400">{format(new Date(c.dateEffet), 'dd/MM/yyyy HH:mm')}</span>
                        <span>{c.typeRole.replace('_', ' ')} : {c.remplace?.prenom} {c.remplace?.nom} → {c.remplacantPrenom} {c.remplacantNom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interruptions */}
              {att.interruptions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400 font-medium mb-2">Arrêts temporaires</div>
                  {att.interruptions.map((intr) => (
                    <div key={intr.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs mb-2">
                      <div className="font-medium text-orange-800 mb-1">Arrêt du {intr.dateArret ? format(new Date(intr.dateArret), 'dd/MM/yyyy') : '—'} à {intr.heureArret || '—'}</div>
                      <div className="text-orange-700">État: <span className="font-semibold capitalize">{intr.etatRegime}</span></div>
                      {intr.dateReprise && <div className="text-orange-700">Reprise: {format(new Date(intr.dateReprise), 'dd/MM/yyyy HH:mm')}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Workflow */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="card">
            <SectionTitle>Progression du workflow</SectionTitle>
            <div className="space-y-4">
              {workflowSteps.map((step, i) => (
                <WorkflowStep key={i} number={i + 1} label={step.label} done={step.done} active={!step.done && (i === 0 || workflowSteps[i - 1]?.done)} date={step.date} user={step.user} />
              ))}
            </div>

            {/* Panneau admin : forcer le statut */}
            {user.role === 'admin' && (
              <div className="mt-5 pt-4 border-t border-red-100">
                <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">⚙️ Administration — Forcer le statut</div>
                <div className="flex gap-2">
                  <select
                    className="input-field text-xs flex-1"
                    value={formData.adminStatus || demande.status}
                    onChange={(e) => setFormData((p) => ({ ...p, adminStatus: e.target.value }))}
                  >
                    {[
                      { v: 'soumise', l: 'Soumise' },
                      { v: 'en_cours_attestation', l: 'Attestation en cours' },
                      { v: 'accord_exploitation', l: 'Accord exploitation' },
                      { v: 'regime_execute', l: 'Régime exécuté' },
                      { v: 'attente_confirmation_assistant', l: 'Attente confirmation assistant' },
                      { v: 'en_cours', l: 'En cours' },
                      { v: 'arret_temporaire', l: 'Arrêt temporaire' },
                      { v: 'operation_terminee', l: 'Opération terminée' },
                      { v: 'cloturee', l: 'Clôturée' },
                      { v: 'rejetee', l: 'Rejetée' },
                    ].map(({ v, l }) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <button
                    disabled={actionLoading || !formData.adminStatus || formData.adminStatus === demande.status}
                    onClick={() => doAction(async (d) => {
                      await api.patch(`/demandes/${demande.id}/status`, { status: d.adminStatus });
                    }, formData)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors shrink-0"
                  >
                    Appliquer
                  </button>
                </div>
                <div className="text-xs text-red-400 mt-1">⚠ Action irréversible — modifie demande et attestation</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card">
            <SectionTitle>Actions disponibles</SectionTitle>
            <div className="space-y-3">
              {/* Chargé consignation: créer attestation */}
              {canConsignation && s === 'soumise' && !att && (
                <button onClick={() => navigate(`/demandes/${id}/attestation`)} className="btn-primary w-full text-sm">📝 Remplir l'attestation</button>
              )}

              {/* Chargé exploitation: accorder */}
              {canExploitation && s === 'en_cours_attestation' && att && !att.accordDate && (
                <button onClick={() => doAction(async () => { await api.post(`/attestations/${att.id}/accord-exploitation`); })} disabled={actionLoading} className="btn-success w-full text-sm">✅ Accorder le régime</button>
              )}

              {/* Chargé consignation: confirmer régime exécuté */}
              {canConsignation && s === 'accord_exploitation' && att && !att.regimeExecuteDate && (
                <button onClick={() => doAction(async () => { await api.post(`/attestations/${att.id}/regime-execute`); })} disabled={actionLoading} className="btn-success w-full text-sm">⚙️ Confirmer consignations OK</button>
              )}

              {/* Chargé travaux principal: accepter le régime */}
              {isMainCT && s === 'regime_execute' && att && !att.regimeDelivreId && (
                <button onClick={() => setModal('demarrer')} className="btn-success w-full text-sm">🚀 Accepter et démarrer les travaux</button>
              )}

              {/* Assistant CT: confirmer sa participation */}
              {isAssistantCT && s === 'attente_confirmation_assistant' && att && (
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-800">
                    ⏳ <strong>{att.regimeDelivre?.prenom} {att.regimeDelivre?.nom}</strong> vous demande de confirmer votre participation pour démarrer les travaux.
                  </div>
                  <button
                    onClick={() => doAction(async () => { await api.post(`/attestations/${att.id}/confirmer-assistant`); })}
                    disabled={actionLoading}
                    className="btn-success w-full text-sm"
                  >
                    ✅ Confirmer ma participation — Démarrer les travaux
                  </button>
                </div>
              )}

              {/* CT principal: info d'attente */}
              {isMainCT && s === 'attente_confirmation_assistant' && att && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-800">
                  ⏳ En attente de confirmation de l'assistant <strong>{att.assistantDelivreNom}</strong> pour démarrer les travaux.
                </div>
              )}

              {/* Chargé travaux: arrêt temporaire */}
              {canTravaux && s === 'en_cours' && (
                <button onClick={() => setModal('arret')} className="btn-danger w-full text-sm">⏸️ Arrêt temporaire</button>
              )}

              {/* Reprendre après arrêt */}
              {canTravaux && s === 'arret_temporaire' && att?.interruptions?.length > 0 && (
                <button onClick={() => setModal('reprendre')} className="btn-primary w-full text-sm">▶️ Reprendre les opérations</button>
              )}

              {/* Changement de chargé — uniquement après démarrage */}
              {canTravaux && ['en_cours', 'arret_temporaire'].includes(s) && (
                <button onClick={() => setModal('changement')} className="btn-outline w-full text-sm">👤 Changement de chargé</button>
              )}

              {/* Chargé travaux: terminer */}
              {canTravaux && s === 'en_cours' && (
                <button
                  onClick={() => doAction(async () => {
                    const assistantTermineeNom = demande.assistantChargeTravaux
                      ? `${demande.assistantChargeTravaux.prenom} ${demande.assistantChargeTravaux.nom}`
                      : undefined;
                    await api.post(`/attestations/${att.id}/terminer-operation`, { assistantTermineeNom });
                  })}
                  disabled={actionLoading}
                  className="btn-secondary w-full text-sm"
                >
                  🏁 Déclarer opération terminée
                </button>
              )}

              {/* Chargé consignation: lever régime */}
              {canConsignation && s === 'operation_terminee' && att && !att.regimeleveDate && (
                <button onClick={() => doAction(async () => { await api.post(`/attestations/${att.id}/lever-regime`); })} disabled={actionLoading} className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm">🔒 Lever le régime (Clôturer)</button>
              )}

              {s === 'cloturee' && (
                <div className="text-center py-3 text-sm text-gray-500 bg-gray-50 rounded-lg">✅ Dossier clôturé et archivé</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            {/* Démarrer travaux */}
            {modal === 'demarrer' && (
              <div>
                <h3 className="text-lg font-bold mb-1">Accepter le régime et démarrer les travaux</h3>
                <p className="text-sm text-gray-500 mb-4">Vous pouvez désigner un assistant Chargé de Travaux. Il recevra une notification de confirmation.</p>
                <div className="mb-4">
                  <label className="label">Assistant Chargé de Travaux (optionnel)</label>
                  <select
                    className="input-field"
                    value={formData.assistantId || ''}
                    onChange={(e) => setFormData({ ...formData, assistantId: e.target.value })}
                  >
                    <option value="">— Aucun assistant —</option>
                    {users
                      .filter((u) => u.active && u.role === 'charge_travaux' && u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.prenom} {u.nom}{u.matricule ? ` (${u.matricule})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                {formData.assistantId ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-sm text-amber-800 mb-4">
                    ⏳ Les travaux ne démarreront qu'après confirmation de l'assistant sélectionné. Une notification lui sera envoyée.
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 mb-4">
                    🚀 Sans assistant, les travaux démarreront immédiatement.
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                  <button onClick={() => doAction(async (d) => { await api.post(`/attestations/${att.id}/demarrer-travaux`, d); }, formData)} disabled={actionLoading} className="btn-success">
                    {formData.assistantId ? '📨 Soumettre pour confirmation' : '🚀 Démarrer les travaux'}
                  </button>
                </div>
              </div>
            )}

            {/* Arrêt temporaire */}
            {modal === 'arret' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Arrêt temporaire des opérations</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.ouvrageDisponible || false} onChange={(e) => setFormData({ ...formData, ouvrageDisponible: e.target.checked })} /><span className="text-sm">Ouvrage disponible</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Date d'arrêt</label><input type="date" className="input-field" value={formData.dateArret || ''} onChange={(e) => setFormData({ ...formData, dateArret: e.target.value })} /></div>
                    <div><label className="label">Heure d'arrêt</label><input type="time" className="input-field" value={formData.heureArret || ''} onChange={(e) => setFormData({ ...formData, heureArret: e.target.value })} /></div>
                  </div>
                  <div><label className="label">Chargé Travaux (arrêt)</label><input className="input-field" value={formData.chargeTravauxArretNom || ''} onChange={(e) => setFormData({ ...formData, chargeTravauxArretNom: e.target.value })} /></div>
                  <div><label className="label">Chargé Consignation 1</label><input className="input-field" value={formData.chargeConsignationArret1Nom || ''} onChange={(e) => setFormData({ ...formData, chargeConsignationArret1Nom: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                  <button onClick={() => doAction(async (d) => { await api.post(`/demandes/${demande.id}/arret-temporaire`, d); }, formData)} disabled={actionLoading} className="btn-danger">Confirmer l'arrêt</button>
                </div>
              </div>
            )}

            {/* Reprendre */}
            {modal === 'reprendre' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Reprendre les opérations</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Date de reprise</label><input type="date" className="input-field" value={formData.dateReprise || ''} onChange={(e) => setFormData({ ...formData, dateReprise: e.target.value })} /></div>
                    <div><label className="label">Heure de reprise</label><input type="time" className="input-field" value={formData.heureReprise || ''} onChange={(e) => setFormData({ ...formData, heureReprise: e.target.value })} /></div>
                  </div>
                  <div><label className="label">Chargé Travaux (reprise)</label><input className="input-field" value={formData.chargeTravauxRepriseNom || ''} onChange={(e) => setFormData({ ...formData, chargeTravauxRepriseNom: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                  <button onClick={() => doAction(async (d) => {
                    const lastIntr = att.interruptions[att.interruptions.length - 1];
                    await api.post(`/demandes/${demande.id}/reprendre`, { ...d, interruptionId: lastIntr.id });
                  }, formData)} disabled={actionLoading} className="btn-success">Confirmer la reprise</button>
                </div>
              </div>
            )}

            {/* Assistant CT */}
            {modal === 'assistant' && (
              <div>
                <h3 className="text-lg font-bold mb-1">
                  {demande.assistantChargeTravaux ? 'Modifier l\'assistant' : 'Désigner un assistant'} Chargé de Travaux
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  L'assistant désigné recevra une notification. Sélectionnez "Aucun" pour retirer l'assistant actuel.
                </p>
                <div className="mb-4">
                  <label className="label">Assistant Chargé de Travaux</label>
                  <select
                    className="input-field"
                    value={formData.assistantId || ''}
                    onChange={(e) => setFormData({ ...formData, assistantId: e.target.value })}
                  >
                    <option value="">— Aucun assistant —</option>
                    {users
                      .filter((u) => u.active && u.role === 'charge_travaux' && u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.prenom} {u.nom}{u.matricule ? ` (${u.matricule})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                {formData.assistantId && formData.assistantId !== demande.assistantChargeTravauxId?.toString() && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 mb-4 flex items-center gap-2">
                    <span>🔔</span>
                    <span>Une notification sera envoyée au nouvel assistant.</span>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                  <button
                    onClick={() => doAction(async (d) => {
                      await api.patch(`/demandes/${demande.id}/assistant`, { assistantId: d.assistantId || null });
                    }, formData)}
                    disabled={actionLoading}
                    className="btn-primary"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}

            {/* Changement chargé */}
            {modal === 'changement' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Changement de chargé</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Type de rôle à remplacer</label>
                    <select className="input-field" value={formData.typeRole || ''} onChange={(e) => setFormData({ ...formData, typeRole: e.target.value })}>
                      <option value="">— Sélectionner —</option>
                      <option value="charge_travaux">Chargé de Travaux</option>
                      <option value="charge_essais">Chargé d'Essais</option>
                      <option value="charge_interventions">Chargé d'Interventions</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Remplacé par (sélectionner)</label>
                    <select className="input-field" value={formData.remplacerId || ''} onChange={(e) => {
                      const selected = users.find((u) => u.id === parseInt(e.target.value));
                      setFormData({ ...formData, remplacerId: e.target.value, remplacantNom: selected?.nom || '', remplacantPrenom: selected?.prenom || '' });
                    }}>
                      <option value="">— Sélectionner un utilisateur —</option>
                      {users.filter((u) => u.active && u.id !== demande.chargeTravauxId).map((u) => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role.replace('_', ' ')})</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="label">Date d'effet</label><input type="datetime-local" className="input-field" value={formData.dateEffet || ''} onChange={(e) => setFormData({ ...formData, dateEffet: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => setModal(null)} className="btn-outline">Annuler</button>
                  <button onClick={() => doAction(async (d) => { await api.post(`/demandes/${demande.id}/changement-charge`, d); }, formData)} disabled={actionLoading || !formData.remplacerId || !formData.typeRole} className="btn-primary">Confirmer le changement</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden print areas */}
      <div className="hidden">
        <DemandePDF ref={demandePrintRef} demande={demande} />
        {att && <AttestationPDF ref={attestationPrintRef} demande={demande} attestation={att} />}
      </div>
    </div>
  );
}

// Inline AttestationForm component
function AttestationForm({ demande, initial, onSubmit, onClose }) {
  const [form, setForm] = useState({
    codeBdm: initial?.codeBdm || '',
    ouvrageDesignation: initial?.ouvrageDesignation || '',
    local: initial?.local || '',
    repere: initial?.repere || '',
    manoeuvresCondamnation: initial?.manoeuvresCondamnation || '',
    instructions: initial?.instructions || [],
    permisFeu: initial?.permisFeu || false,
    permisFouille: initial?.permisFouille || false,
    permisControleRadio: initial?.permisControleRadio || false,
    permisAcces: initial?.permisAcces || false,
  });
  const [newIns, setNewIns] = useState({ repere: '', instruction: '', local: '', etat: '' });

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addInstruction = () => {
    if (!newIns.instruction) return;
    setForm((p) => ({ ...p, instructions: [...p.instructions, { ...newIns }] }));
    setNewIns({ repere: '', instruction: '', local: '', etat: '' });
  };

  const removeInstruction = (i) => setForm((p) => ({ ...p, instructions: p.instructions.filter((_, idx) => idx !== i) }));

  return (
    <div className="max-h-screen overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">{initial ? 'Modifier l\'attestation' : 'Remplir l\'attestation'}</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Code BDM</label><input className="input-field" value={form.codeBdm} onChange={set('codeBdm')} /></div>
          <div><label className="label">Désignation ouvrage</label><input className="input-field" value={form.ouvrageDesignation} onChange={set('ouvrageDesignation')} /></div>
          <div><label className="label">Local</label><input className="input-field" value={form.local} onChange={set('local')} /></div>
          <div><label className="label">Repère</label><input className="input-field" value={form.repere} onChange={set('repere')} /></div>
        </div>
        <div><label className="label">Manœuvres de condamnation N°</label><input className="input-field" value={form.manoeuvresCondamnation} onChange={set('manoeuvresCondamnation')} /></div>

        {/* Instructions */}
        <div>
          <label className="label mb-2">Instructions</label>
          {form.instructions.map((ins, i) => (
            <div key={i} className="flex gap-2 items-center text-xs bg-gray-50 p-2 rounded mb-1">
              <span className="font-mono">{ins.repere}</span>
              <span className="flex-1">{ins.instruction}</span>
              <span>{ins.local}</span><span>{ins.etat}</span>
              <button onClick={() => removeInstruction(i)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          ))}
          <div className="grid grid-cols-4 gap-2 mt-2">
            <input placeholder="Repère" className="input-field text-xs" value={newIns.repere} onChange={(e) => setNewIns((p) => ({ ...p, repere: e.target.value }))} />
            <input placeholder="Instruction" className="input-field col-span-2 text-xs" value={newIns.instruction} onChange={(e) => setNewIns((p) => ({ ...p, instruction: e.target.value }))} />
            <input placeholder="État (CD/CF...)" className="input-field text-xs" value={newIns.etat} onChange={(e) => setNewIns((p) => ({ ...p, etat: e.target.value }))} />
          </div>
          <button onClick={addInstruction} type="button" className="text-xs text-steg-primary hover:underline mt-1">+ Ajouter une instruction</button>
        </div>

        <div>
          <label className="label">Documents joints</label>
          <div className="grid grid-cols-2 gap-2">
            {[['permisFeu','Permis de feu'],['permisFouille','Permis de fouille'],['permisControleRadio','Permis contrôle radio'],['permisAcces',"Permis d'accès"]].map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form[k]} onChange={set(k)} /><span className="text-sm">{l}</span></label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-6">
        <button onClick={onClose} className="btn-outline">Annuler</button>
        <button onClick={() => onSubmit(form)} className="btn-primary">Enregistrer</button>
      </div>
    </div>
  );
}
