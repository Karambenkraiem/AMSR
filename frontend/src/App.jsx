import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppInstallPrompt from './components/AppInstallPrompt';
import Layout from './components/Layout';
import Login from './pages/Login';
import AppDownload from './pages/AppDownload';
import Dashboard from './pages/Dashboard';
import ListeDemandes from './pages/demandes/ListeDemandes';
import NouvelleDemande from './pages/demandes/NouvelleDemande';
import DetailDemande from './pages/demandes/DetailDemande';
import ListeAttestations from './pages/attestations/ListeAttestations';
import DetailAttestation from './pages/attestations/DetailAttestation';
import RemplirAttestation from './pages/attestations/RemplirAttestation';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';
import GestionDelegations from './pages/delegations/GestionDelegations';
import MonCompte from './pages/MonCompte';

const NON_GUEST_ROLES = ['admin', 'charge_travaux', 'charge_consignation', 'charge_exploitation', 'chef_centrale', 'chef_maintenance', 'directeur', 'animateur_securite', 'responsable_securite'];

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-steg-primary"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/app" element={<AppDownload />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="demandes" element={<ListeDemandes />} />
        <Route path="demandes/nouvelle" element={<PrivateRoute roles={['charge_travaux', 'admin']}><NouvelleDemande /></PrivateRoute>} />
        <Route path="demandes/:id" element={<DetailDemande />} />
        <Route path="demandes/:id/attestation" element={<PrivateRoute roles={['charge_consignation', 'admin']}><RemplirAttestation /></PrivateRoute>} />
        <Route path="attestations" element={<ListeAttestations />} />
        <Route path="attestations/:id" element={<DetailAttestation />} />
        <Route path="admin/utilisateurs" element={<PrivateRoute roles={['admin']}><GestionUtilisateurs /></PrivateRoute>} />
        <Route path="delegations" element={<PrivateRoute roles={['charge_exploitation', 'chef_centrale', 'admin']}><GestionDelegations /></PrivateRoute>} />
        <Route path="mon-compte" element={<PrivateRoute roles={NON_GUEST_ROLES}><MonCompte /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <AppInstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}
