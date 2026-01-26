/**
 * PetCareApp - Główny komponent aplikacji
 * Zawiera routing oraz lazy loading dla optymalizacji
 * @author VS
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy loading komponentów dla optymalizacji wydajności - VS
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

// Dashboardy dla różnych ról - VS
const ClientDashboard = lazy(() => import('./pages/dashboards/ClientDashboard'));
const VetDashboard = lazy(() => import('./pages/dashboards/VetDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboards/AdminDashboard'));
const ITDashboard = lazy(() => import('./pages/dashboards/ITDashboard'));

// Podstrony klienta - VS
const ClientPets = lazy(() => import('./pages/client/ClientPets'));
const ClientAppointments = lazy(() => import('./pages/client/ClientAppointments'));
const ClientNotifications = lazy(() => import('./pages/client/ClientNotifications'));
const ClientPayments = lazy(() => import('./pages/client/ClientPayments'));
const ClientContact = lazy(() => import('./pages/client/ClientContact'));

// Podstrony weterynarza - VS
const VetPatients = lazy(() => import('./pages/vet/VetPatients'));
const VetMedicalRecords = lazy(() => import('./pages/vet/VetMedicalRecords'));
const VetSchedule = lazy(() => import('./pages/vet/VetSchedule'));
const VetStats = lazy(() => import('./pages/vet/VetStats'));
const VetDrugs = lazy(() => import('./pages/vet/VetDrugs'));
const VetAlerts = lazy(() => import('./pages/vet/VetAlerts'));

// Podstrony admina - VS
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminContent = lazy(() => import('./pages/admin/AdminContent'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

// Podstrony IT - VS
const ITSystemStatus = lazy(() => import('./pages/it/ITSystemStatus'));
const ITLogs = lazy(() => import('./pages/it/ITLogs'));
const ITMonitoring = lazy(() => import('./pages/it/ITMonitoring'));
const ITSecurity = lazy(() => import('./pages/it/ITSecurity'));
const ITInfrastructure = lazy(() => import('./pages/it/ITInfrastructure'));

// Strony błędów - VS
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * Główny komponent aplikacji - zarządza routingiem i autoryzacją
 * @returns {JSX.Element} Główny komponent App
 */
function App() {
    const { user, isLoading } = useAuth();

    // Funkcja przekierowująca do odpowiedniego dashboardu - VS
    const getDashboardPath = (role) => {
        const dashboardPaths = {
            'client': '/dashboard/client',
            'vet': '/dashboard/vet',
            'admin': '/dashboard/admin',
            'it': '/dashboard/it'
        };
        return dashboardPaths[role] || '/';
    };

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
                {/* Strony publiczne - VS */}
                <Route path="/" element={<LandingPage />} />
                <Route 
                    path="/login" 
                    element={user ? <Navigate to={getDashboardPath(user.role)} /> : <LoginPage />} 
                />
                <Route 
                    path="/register" 
                    element={user ? <Navigate to={getDashboardPath(user.role)} /> : <RegisterPage />} 
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Dashboard Klienta - VS */}
                <Route 
                    path="/dashboard/client" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/client/pets" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientPets />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/client/appointments" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientAppointments />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/client/notifications" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientNotifications />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/client/payments" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientPayments />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/client/contact" 
                    element={
                        <ProtectedRoute allowedRoles={['client']}>
                            <ClientContact />
                        </ProtectedRoute>
                    } 
                />

                {/* Dashboard Weterynarza - VS */}
                <Route 
                    path="/dashboard/vet" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/patients" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetPatients />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/records" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetMedicalRecords />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/schedule" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetSchedule />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/stats" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetStats />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/drugs" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetDrugs />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/vet/alerts" 
                    element={
                        <ProtectedRoute allowedRoles={['vet']}>
                            <VetAlerts />
                        </ProtectedRoute>
                    } 
                />

                {/* Dashboard Administratora - VS */}
                <Route 
                    path="/dashboard/admin" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/admin/users" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminUsers />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/admin/appointments" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminAppointments />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/admin/services" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminServices />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/admin/content" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminContent />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/admin/reports" 
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminReports />
                        </ProtectedRoute>
                    } 
                />

                {/* Dashboard IT - VS */}
                <Route 
                    path="/dashboard/it" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/it/status" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITSystemStatus />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/it/logs" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITLogs />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/it/monitoring" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITMonitoring />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/it/security" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITSecurity />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/dashboard/it/infrastructure" 
                    element={
                        <ProtectedRoute allowedRoles={['it']}>
                            <ITInfrastructure />
                        </ProtectedRoute>
                    } 
                />

                {/* Strona 404 - VS */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

export default App;
