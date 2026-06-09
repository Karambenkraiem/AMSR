import React, { forwardRef } from 'react';
import { format } from 'date-fns';

const REGIME_LABELS = {
  consignation: 'Consignation', exceptionnel_travaux: 'Exceptionnel de Travaux',
  essais: 'Essais', requisition: 'Réquisition', interventions: 'Interventions',
};

const DemandePDF = forwardRef(({ demande }, ref) => {
  if (!demande) return null;
  const d = demande;
  const datePrevu = d.datePrevu ? new Date(d.datePrevu) : null;

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', padding: '20mm', width: '210mm', minHeight: '297mm', color: '#000', background: '#fff' }}>
      {/* Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '3mm 4mm', width: '40%' }}>
              <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>STEG / C.P. - Centrale de :</div>
              <div style={{ marginTop: '2mm', fontSize: '10pt' }}>{d.centrale}</div>
            </td>
            <td style={{ border: '1px solid #000', padding: '3mm 4mm', textAlign: 'center' }}>
              <div style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase' }}>DEMANDE DE MISE SOUS RÉGIME</div>
              <div style={{ marginTop: '2mm', fontSize: '9pt' }}>
                <label style={{ marginRight: '8mm' }}>
                  <input type="checkbox" checked={d.typeBon === 'travail'} readOnly style={{ marginRight: '2mm' }} />
                  Suite au Bon de Travail N° : {d.typeBon === 'travail' ? (d.numeroBon || '') : ''}
                </label>
                <label>
                  <input type="checkbox" checked={d.typeBon === 'visite_systematique'} readOnly style={{ marginRight: '2mm' }} />
                  Suite au Bon de Visite systématique N° : {d.typeBon === 'visite_systematique' ? (d.numeroBon || '') : ''}
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Désignation */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '2mm 3mm' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1mm' }}>Désignation de l'opération :</div>
              <div style={{ minHeight: '8mm' }}>{d.designationOperation}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Localisation + Ouvrages + Régime */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '2mm', width: '30%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2mm' }}>LOCALISATION</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ border: '1px solid #000', padding: '1mm', width: '25%', fontSize: '8pt' }}>TR</th>
                  <th style={{ border: '1px solid #000', padding: '1mm', width: '25%', fontSize: '8pt' }}>TG</th>
                  <th style={{ border: '1px solid #000', padding: '1mm', fontSize: '8pt' }}>NIVEAU (m)</th>
                </tr></thead>
                <tbody><tr>
                  <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>{d.tr}</td>
                  <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>{d.tg}</td>
                  <td style={{ border: '1px solid #000', padding: '2mm', textAlign: 'center' }}>{d.niveau}</td>
                </tr></tbody>
              </table>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm', width: '35%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2mm' }}>OUVRAGES CONCERNÉS</div>
              <div style={{ minHeight: '12mm' }}>{d.ouvragesConcernes}</div>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2mm' }}>RÉGIME DE :</div>
              {[['consignation','CONSIGNATION'],['exceptionnel_travaux','EXCEPTIONNEL DE TRAVAUX'],['essais','ESSAIS'],['requisition','RÉQUISITION'],['interventions','INTERVENTIONS']].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '1mm' }}>
                  <input type="checkbox" checked={d.regimeType === k} readOnly />
                  <span style={{ fontSize: '8.5pt' }}>{l}</span>
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Date + Service */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '2mm', width: '45%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1mm' }}>Demandé pour le :</div>
              <table style={{ borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ border: '1px solid #000', padding: '1mm 3mm', fontSize: '8pt' }}>J</th>
                  <th style={{ border: '1px solid #000', padding: '1mm 3mm', fontSize: '8pt' }}>M</th>
                  <th style={{ border: '1px solid #000', padding: '1mm 3mm', fontSize: '8pt' }}>A</th>
                  <th style={{ border: '1px solid #000', padding: '1mm 3mm', fontSize: '8pt' }}>H</th>
                </tr></thead>
                <tbody><tr>
                  <td style={{ border: '1px solid #000', padding: '2mm 4mm', textAlign: 'center' }}>{datePrevu ? format(datePrevu, 'dd') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2mm 4mm', textAlign: 'center' }}>{datePrevu ? format(datePrevu, 'MM') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2mm 4mm', textAlign: 'center' }}>{datePrevu ? format(datePrevu, 'yyyy') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '2mm 4mm', textAlign: 'center' }}>{datePrevu ? format(datePrevu, 'HH:mm') : ''}</td>
                </tr></tbody>
              </table>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1mm' }}>Durée prévue de l'opération :</div>
              <div>{d.dureePrevu}</div>
            </td>
            <td style={{ border: '1px solid #000', padding: '2mm' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1mm' }}>Service demandeur :</div>
              <div>{d.serviceDemandeur}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Instructions particulières */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '2mm' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '1mm' }}>Instructions particulières :</div>
              <div style={{ minHeight: '15mm' }}>{d.instructionsParticulieres}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Documents + Signatures */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '3mm', width: '40%', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2mm' }}>Document(s) associé(s) à la mise sous régime :</div>
              {[['permisFeu','Permis de feu'],['permisControle','Permis de contrôle'],['permisAcces',"Permis d'accès"],['permisRadiographique','Permis radiographique'],['permisFouille','Permis de fouille']].map(([k,l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '3mm', marginBottom: '2mm' }}>
                  <input type="checkbox" checked={d[k]} readOnly />
                  <span style={{ fontSize: '8.5pt' }}>{l}</span>
                </div>
              ))}
            </td>
            <td style={{ border: '1px solid #000', padding: '3mm', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '3mm' }}>Nom et visa de l'Assistante au Chargé de Travaux :</div>
              <div style={{ marginBottom: '3mm', minHeight: '8mm' }}>{d.assistantNom}</div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '3mm', fontWeight: 'bold', fontSize: '9pt', marginBottom: '3mm', marginTop: '3mm' }}>Nom et visa du Chargé de Travaux :</div>
              <div style={{ marginBottom: '3mm' }}>{d.chargeTravaux?.prenom} {d.chargeTravaux?.nom}</div>
              <div style={{ fontSize: '8pt', color: '#666' }}>Matricule: {d.chargeTravaux?.matricule}</div>
              <div style={{ fontSize: '8pt', color: '#666' }}>Date: {format(new Date(d.createdAt), 'dd/MM/yyyy HH:mm')}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '5mm', fontSize: '8pt', color: '#666', textAlign: 'center' }}>
        Système AMSR - STEG | Document généré le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
      </div>
    </div>
  );
});

DemandePDF.displayName = 'DemandePDF';
export default DemandePDF;
