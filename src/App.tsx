import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CitizenLayout } from './components/layout/CitizenLayout';
import { AuthorityLayout } from './components/layout/AuthorityLayout';
import { AuthLayout } from './components/layout/AuthLayout';

import { CitizenHome } from './pages/citizen/Home';
import { CitizenDashboard } from './pages/citizen/Dashboard';
import { ReportIncident } from './pages/citizen/ReportIncident';
import { LiveMap } from './pages/public/LiveMap';

import { VolunteerDashboard } from './pages/volunteer/Dashboard';

import { Incidents as AuthorityIncidents } from './pages/authority/Incidents';
import { CreateIncident as AuthorityCreateIncident } from './pages/authority/CreateIncident';
import { IncidentDetails as AuthorityIncidentDetails } from './pages/authority/IncidentDetails';
import { Coordination as AuthorityCoordination } from './pages/authority/Coordination';
import { Monitoring as AuthorityMonitoring } from './pages/authority/Monitoring';
import { Notifications as AuthorityNotifications } from './pages/authority/Notifications';
import { AuthorityLiveMap } from './pages/authority/LiveMap';
import { AuthorityVolunteers } from './pages/authority/Volunteers';
import { AuthorityResources } from './pages/authority/Resources';
import { AuthorityReports } from './pages/authority/Reports';
import { AuthoritySettings } from './pages/authority/Settings';

import { VolunteerLogin } from './pages/auth/VolunteerLogin';
import { VolunteerRegister } from './pages/auth/VolunteerRegister';
import { RoleSelection } from './pages/auth/RoleSelection';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Reporting */}
          <Route path="/" element={<CitizenHome />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/report" element={<ReportIncident />} />

          {/* Authentication Routes */}
          <Route path="/auth/select" element={<RoleSelection />} />
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="volunteer/login" element={<VolunteerLogin />} />
            <Route path="volunteer/register" element={<VolunteerRegister />} />
          </Route>

          {/* Citizen Protected Routes */}
          <Route path="/citizen" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="/citizen/dashboard" element={<CitizenDashboard />} />

          {/* Volunteer Protected Routes */}
          <Route path="/volunteer" element={<CitizenLayout />}>
            <Route index element={<Navigate to="/volunteer/dashboard" replace />} />
            <Route path="dashboard" element={<VolunteerDashboard />} />
          </Route>

          {/* Authority (Admin) Routes */}
          <Route path="/admin" element={<AuthorityLayout />}>
            <Route index element={<Navigate to="/admin/map" replace />} />
            <Route path="dashboard" element={<Navigate to="/admin/map" replace />} />
            <Route path="map" element={<AuthorityLiveMap />} />
            <Route path="incidents" element={<AuthorityIncidents />} />
            <Route path="incidents/new" element={<AuthorityCreateIncident />} />
            <Route path="incidents/:id" element={<AuthorityIncidentDetails />} />
            <Route path="volunteers" element={<AuthorityVolunteers />} />
            <Route path="resources" element={<AuthorityResources />} />
            <Route path="coordination" element={<AuthorityCoordination />} />
            <Route path="monitoring" element={<AuthorityMonitoring />} />
            <Route path="notifications" element={<AuthorityNotifications />} />
            <Route path="reports" element={<AuthorityReports />} />
            <Route path="settings" element={<AuthoritySettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
