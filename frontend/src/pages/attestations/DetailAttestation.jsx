import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

export default function DetailAttestation() {
  const { id } = useParams();
  // Redirect to demande detail since attestations are managed within demandes
  return <Navigate to={`/demandes`} replace />;
}
