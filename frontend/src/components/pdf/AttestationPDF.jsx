import React, { forwardRef } from 'react';
import { format } from 'date-fns';

const Cell = ({ children, style = {} }) => (
  <td style={{ border: '1px solid #000', padding: '1.5mm 2mm', ...style }}>{children}</td>
);

const SigBlock = ({ title, user, date, style = {} }) => (
  <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top', ...style }}>
    <div style={{ fontWeight: 'bold', fontSize: '7pt', textAlign: 'center', background: '#333', color: '#fff', padding: '1mm', marginBottom: '1mm' }}>{title}</div>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <Cell style={{ width: '20%', fontSize: '7pt' }}>J</Cell>
          <Cell style={{ width: '20%', fontSize: '7pt' }}>M</Cell>
          <Cell style={{ width: '20%', fontSize: '7pt' }}>H</Cell>
        </tr>
        <tr>
          <Cell style={{ fontSize: '7pt' }}>{date ? format(new Date(date), 'dd') : ''}</Cell>
          <Cell style={{ fontSize: '7pt' }}>{date ? format(new Date(date), 'MM') : ''}</Cell>
          <Cell style={{ fontSize: '7pt' }}>{date ? format(new Date(date), 'HH:mm') : ''}</Cell>
        </tr>
        <tr><Cell style={{ fontSize: '7pt', fontWeight: 'bold' }}>NOM</Cell><Cell colSpan={2} style={{ fontSize: '7pt', fontWeight: 'bold' }}>VISA</Cell></tr>
        <tr>
          <Cell style={{ fontSize: '7pt', minHeight: '8mm' }}>{user ? `${user.prenom} ${user.nom}` : ''}</Cell>
          <Cell colSpan={2} style={{ minHeight: '8mm' }}></Cell>
        </tr>
      </tbody>
    </table>
  </td>
);

const AttestationPDF = forwardRef(({ demande, attestation }, ref) => {
  if (!demande || !attestation) return null;
  const d = demande;
  const a = attestation;
  const datePrevu = d.datePrevu ? new Date(d.datePrevu) : null;

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', padding: '10mm', width: '210mm', color: '#000', background: '#fff' }}>
      {/* HEADER */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '2mm', width: '30%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>STEG / C.P. - Centrale de :</div>
              <div style={{ fontSize: '9pt' }}>{d.centrale}</div>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>ATTESTATION DE MISE SOUS RÉGIME</div>
              <div style={{ fontSize: '8pt', marginTop: '1mm' }}>
                <input type="checkbox" checked={d.typeBon === 'travail'} readOnly /> Suite au Bon de Travail N° : {d.typeBon === 'travail' ? d.numeroBon : ''}
                &nbsp;&nbsp;
                <input type="checkbox" checked={d.typeBon === 'visite_systematique'} readOnly /> Suite au Bon de Visite systématique N° : {d.typeBon === 'visite_systematique' ? d.numeroBon : ''}
              </div>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center', width: '12%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>N° {a.numero}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', verticalAlign: 'top' }}>
              {/* Left column */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '2mm' }}>
                      <span style={{ fontWeight: 'bold' }}>RÉGIME DEMANDÉ PAR : </span>{d.serviceDemandeur}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '2mm' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>DÉSIGNATION DE L'OPÉRATION :</div>
                      <div>{d.designationOperation}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '2mm', width: '40%', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '1mm' }}>LOCALISATION</div>
                      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                        <thead><tr>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>TR</th>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>TG</th>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>NIVEAU (m)</th>
                        </tr></thead>
                        <tbody><tr>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center' }}>{d.tr}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center' }}>{d.tg}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center' }}>{d.niveau}</td>
                        </tr></tbody>
                      </table>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '1mm' }}>OUVRAGE CONCERNÉ</div>
                      <div style={{ fontSize: '8pt' }}><span style={{ fontWeight: 'bold' }}>Code BDM: </span>{a.codeBdm}</div>
                      <div style={{ fontSize: '8pt' }}><span style={{ fontWeight: 'bold' }}>Désignation: </span>{a.ouvrageDesignation}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '1mm' }}>LOCAL</div>
                      <div>{a.local}</div>
                    </td>
                    <td style={{ border: '1px solid #000', padding: '2mm' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', width: '25%' }}>DATE PRÉVUE</th>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', width: '25%' }} colSpan={3}>J M H</th>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>DURÉE PRÉVUE</th>
                          <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>SERVICE OU ENTREPRISE</th>
                        </tr></thead>
                        <tbody><tr>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center', fontSize: '8pt' }}></td>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center', fontSize: '8pt' }}>{datePrevu ? format(datePrevu, 'dd') : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center', fontSize: '8pt' }}>{datePrevu ? format(datePrevu, 'MM') : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', textAlign: 'center', fontSize: '8pt' }}>{datePrevu ? format(datePrevu, 'HH:mm') : ''}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '8pt' }}>{d.dureePrevu}</td>
                          <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '8pt' }}>{d.serviceDemandeur}</td>
                        </tr></tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Instructions Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1mm' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '1mm', width: '15%', fontSize: '7pt' }}>REPÈRE</th>
                    <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>INSTRUCTIONS</th>
                    <th style={{ border: '1px solid #000', padding: '1mm', width: '10%', fontSize: '7pt' }}>LOCAL</th>
                    <th style={{ border: '1px solid #000', padding: '1mm', width: '10%', fontSize: '7pt' }}>ÉTAT</th>
                  </tr>
                  {a.manoeuvresCondamnation && (
                    <tr>
                      <td colSpan={4} style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>
                        <input type="checkbox" checked readOnly /> Manœuvres de condamnation suivant fiche jointe N° : {a.manoeuvresCondamnation}
                      </td>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {(a.instructions || []).map((ins, i) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>{ins.repere}</td>
                      <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>{ins.instruction}</td>
                      <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{ins.local}</td>
                      <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{ins.etat}</td>
                    </tr>
                  ))}
                  {/* Empty rows */}
                  {Array.from({ length: Math.max(0, 6 - (a.instructions || []).length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td style={{ border: '1px solid #000', padding: '3mm' }}></td>
                      <td style={{ border: '1px solid #000', padding: '3mm' }}></td>
                      <td style={{ border: '1px solid #000', padding: '3mm' }}></td>
                      <td style={{ border: '1px solid #000', padding: '3mm' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legend */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2mm' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '2mm', fontSize: '7pt' }}>
                      <strong>LÉGENDE :</strong> CD=Condamné Débroché | CF=Condamné Fermé | CO=Condamné Ouvert | D'=à disposition Débroché | F'=à disposition Fermé | O'=à disposition Ouvert | E'=à disposition Embroché | C'=à disposition Condamné | MC=Ouvrage concerné
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            {/* Right column: Signatures */}
            <td style={{ width: '40%', verticalAlign: 'top' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <tbody>
                  {/* Régime type */}
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '2mm' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '1mm' }}>TYPE DE RÉGIME</div>
                      {[['consignation','CONSIGNATION (RC)'],['exceptionnel_travaux','EXCEPTIONNEL DE TRAVAUX (RET)'],['essais','ESSAIS (RE)'],['requisition','RÉQUISITION (RR)'],['interventions','INTERVENTIONS (RI)']].map(([k,l]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm', fontSize: '8pt' }}>
                          <input type="checkbox" checked={d.regimeType === k} readOnly /> {l}
                        </div>
                      ))}
                    </td>
                  </tr>
                  {/* Documents joints */}
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', padding: '2mm' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '8pt', marginBottom: '1mm' }}>DOCUMENTS JOINTS</div>
                      {[['permisFeu','PERMIS DE FEU'],['permisFouille','PERMIS DE FOUILLE'],['permisControleRadio','PERMIS DE CONTRÔLE RADIO'],['permisAcces',"PERMIS D'ACCÈS"]].map(([k,l]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm', fontSize: '8pt' }}>
                          <input type="checkbox" checked={a[k]} readOnly /> {l}
                        </div>
                      ))}
                    </td>
                  </tr>
                  {/* ACCORD */}
                  <tr>
                    <SigBlock title="ACCORD — CHARGÉ D'EXPLOITATION" user={a.accordExploitation} date={a.accordDate} style={{ padding: '2mm' }} />
                  </tr>
                  {/* RÉGIME EXÉCUTÉ */}
                  <tr>
                    <SigBlock title="RÉGIME EXÉCUTÉ — CHARGÉ DE CONSIGNATION" user={a.regimeExecute} date={a.regimeExecuteDate} style={{ padding: '2mm' }} />
                  </tr>
                  {/* RÉGIME DÉLIVRÉ */}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '7pt', textAlign: 'center', background: '#333', color: '#fff', padding: '1mm', marginBottom: '1mm' }}>RÉGIME DÉLIVRÉ — CHARGÉ DE TRAVAUX</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <Cell style={{ fontSize: '7pt' }}>J</Cell><Cell style={{ fontSize: '7pt' }}>M</Cell><Cell style={{ fontSize: '7pt' }}>H</Cell>
                          </tr>
                          <tr>
                            <Cell style={{ fontSize: '7pt' }}>{a.regimeDelivreDate ? format(new Date(a.regimeDelivreDate), 'dd') : ''}</Cell>
                            <Cell style={{ fontSize: '7pt' }}>{a.regimeDelivreDate ? format(new Date(a.regimeDelivreDate), 'MM') : ''}</Cell>
                            <Cell style={{ fontSize: '7pt' }}>{a.regimeDelivreDate ? format(new Date(a.regimeDelivreDate), 'HH:mm') : ''}</Cell>
                          </tr>
                          <tr><Cell style={{ fontSize: '7pt', fontWeight: 'bold' }}>NOM</Cell><Cell colSpan={2} style={{ fontSize: '7pt', fontWeight: 'bold' }}>VISA</Cell></tr>
                          <tr>
                            <Cell style={{ fontSize: '7pt' }}>{a.regimeDelivre ? `${a.regimeDelivre.prenom} ${a.regimeDelivre.nom}` : ''}</Cell>
                            <Cell colSpan={2} style={{ minHeight: '6mm' }}></Cell>
                          </tr>
                          <tr><Cell colSpan={3} style={{ fontSize: '7pt', fontWeight: 'bold' }}>ASSISTANT : {a.assistantDelivreNom || ''}</Cell></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  {/* OPÉRATION TERMINÉE */}
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '7pt', textAlign: 'center', background: '#333', color: '#fff', padding: '1mm', marginBottom: '1mm' }}>OPÉRATION TERMINÉE</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr><Cell style={{ fontSize: '7pt' }}>J</Cell><Cell style={{ fontSize: '7pt' }}>M</Cell><Cell style={{ fontSize: '7pt' }}>H</Cell></tr>
                          <tr>
                            <Cell style={{ fontSize: '7pt' }}>{a.operationTermineeDate ? format(new Date(a.operationTermineeDate), 'dd') : ''}</Cell>
                            <Cell style={{ fontSize: '7pt' }}>{a.operationTermineeDate ? format(new Date(a.operationTermineeDate), 'MM') : ''}</Cell>
                            <Cell style={{ fontSize: '7pt' }}>{a.operationTermineeDate ? format(new Date(a.operationTermineeDate), 'HH:mm') : ''}</Cell>
                          </tr>
                          <tr><Cell style={{ fontSize: '7pt', fontWeight: 'bold' }}>NOM</Cell><Cell colSpan={2} style={{ fontSize: '7pt', fontWeight: 'bold' }}>VISA</Cell></tr>
                          <tr>
                            <Cell style={{ fontSize: '7pt' }}>{a.operationTerminee ? `${a.operationTerminee.prenom} ${a.operationTerminee.nom}` : ''}</Cell>
                            <Cell colSpan={2} style={{ minHeight: '6mm' }}></Cell>
                          </tr>
                          <tr><Cell colSpan={3} style={{ fontSize: '7pt' }}>ASSISTANT : {a.assistantTermineeNom || ''}</Cell></tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  {/* RÉGIME LEVÉ */}
                  <tr>
                    <SigBlock title="RÉGIME LEVÉ — CHARGÉ DE CONSIGNATION" user={a.regimeLeve} date={a.regimeleveDate} style={{ padding: '2mm' }} />
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Changements de chargé */}
      {a.changements && a.changements.length > 0 && (
        <div style={{ marginTop: '4mm', pageBreakBefore: 'avoid' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={5} style={{ border: '1px solid #000', padding: '2mm', fontSize: '8pt', fontWeight: 'bold', textAlign: 'center', background: '#eee' }}>
                  CHANGEMENT DE CHARGÉ DE TRAVAUX / D'ESSAIS / D'INTERVENTIONS OU D'ASSISTANT
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>NOM DU REMPLAÇANT</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>DATE D'EFFET</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>J</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>M</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>H</th>
              </tr>
            </thead>
            <tbody>
              {a.changements.map((c) => (
                <tr key={c.id}>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>{c.remplacantPrenom} {c.remplacantNom}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>{c.typeRole.replace('_', ' ')}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{format(new Date(c.dateEffet), 'dd')}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{format(new Date(c.dateEffet), 'MM')}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{format(new Date(c.dateEffet), 'HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interruptions */}
      {a.interruptions && a.interruptions.length > 0 && (
        <div style={{ marginTop: '4mm' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={6} style={{ border: '1px solid #000', padding: '2mm', fontSize: '8pt', fontWeight: 'bold', textAlign: 'center', background: '#eee' }}>
                  OPÉRATIONS INTERROMPUES
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>OUVRAGE DISPONIBLE</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>ARRÊT TEMPORAIRE DES OPÉRATIONS</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>ÉTAT DU RÉGIME</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>DATE ARRÊT</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>HEURE ARRÊT</th>
                <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>DATE REPRISE</th>
              </tr>
            </thead>
            <tbody>
              {a.interruptions.map((intr) => (
                <tr key={intr.id}>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{intr.ouvrageDisponible ? 'OUI' : 'NON'}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt' }}>{intr.chargeTravauxArretNom}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center', textTransform: 'capitalize' }}>{intr.etatRegime}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{intr.dateArret ? format(new Date(intr.dateArret), 'dd/MM/yyyy') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{intr.heureArret}</td>
                  <td style={{ border: '1px solid #000', padding: '1mm', fontSize: '7pt', textAlign: 'center' }}>{intr.dateReprise ? format(new Date(intr.dateReprise), 'dd/MM/yyyy HH:mm') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '4mm', fontSize: '7pt', color: '#666', textAlign: 'center' }}>
        Système AMSR - STEG | Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
      </div>
    </div>
  );
});

AttestationPDF.displayName = 'AttestationPDF';
export default AttestationPDF;
