import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import MobileAppBanner from './MobileAppBanner';

const ROLE_LABELS = {
  admin: 'Administrateur',
  charge_travaux: 'Chargé de Travaux',
  charge_consignation: 'Chargé de Consignation',
  charge_exploitation: 'Chargé d\'Exploitation',
  chef_centrale: 'Chef de Centrale',
  chef_maintenance: 'Chef Maintenance',
};

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-steg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-steg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">S</div>
            {sidebarOpen && (
              <div>
                <div className="font-bold text-steg-dark text-sm">STEG</div>
                <div className="text-xs text-gray-500">Système AMSR</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarOpen ? (
            <>
              <NavItem to="/" icon="🏠" label="Tableau de bord" />
              <NavItem to="/demandes" icon="📋" label="Demandes MSR" />
              {['charge_travaux', 'admin', 'chef_centrale', 'chef_maintenance', 'charge_consignation'].includes(user?.role) && (
                <NavItem to="/demandes/nouvelle" icon="➕" label="Nouvelle Demande" />
              )}
              <NavItem to="/attestations" icon="📄" label="Attestations MSR" />
              {['charge_exploitation', 'chef_centrale', 'admin'].includes(user?.role) && (
                <NavItem to="/delegations" icon="🔑" label="Délégations" />
              )}
              {user?.delegatedRoles?.length > 0 && (
                <div className="mx-4 my-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  🔑 Rôle(s) délégué(s) actif(s)
                </div>
              )}
              {user?.role === 'admin' && (
                <>
                  <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</div>
                  <NavItem to="/admin/utilisateurs" icon="👥" label="Utilisateurs" />
                </>
              )}
            </>
          ) : (
            <>
              <NavLink to="/" className="flex justify-center p-3 rounded-lg hover:bg-gray-100" title="Tableau de bord">🏠</NavLink>
              <NavLink to="/demandes" className="flex justify-center p-3 rounded-lg hover:bg-gray-100" title="Demandes MSR">📋</NavLink>
              <NavLink to="/attestations" className="flex justify-center p-3 rounded-lg hover:bg-gray-100" title="Attestations MSR">📄</NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-steg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user?.prenom} {user?.nom}</div>
                <div className="text-xs text-gray-500 truncate">{ROLE_LABELS[user?.role]}</div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-lg" title="Déconnexion">⏻</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 text-gray-400 hover:text-red-500" title="Déconnexion">⏻</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.centrale}</span>
            <NotificationBell />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>

    <MobileAppBanner />
    </>
  );
}
