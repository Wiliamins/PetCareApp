/**
 * PetCareApp - Komponent ProtectedRoute
 * Ochrona tras przed nieautoryzowanym dostępem
 * @author VS
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Komponent chroniący trasy wymagające autoryzacji
 * @param {Object} props - Właściwości
 * @param {React.ReactNode} props.children - Komponenty dzieci
 * @param {Array<string>} props.allowedRoles - Dozwolone role
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Oczekiwanie na sprawdzenie sesji - VS
    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    // Brak autoryzacji - przekierowanie do logowania - VS
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Sprawdzenie roli użytkownika - VS
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Przekierowanie do właściwego dashboardu - VS
        const dashboardPaths = {
            'client': '/dashboard/client',
            'vet': '/dashboard/vet',
            'admin': '/dashboard/admin',
            'it': '/dashboard/it'
        };

        const correctPath = dashboardPaths[user.role] || '/';
        return <Navigate to={correctPath} replace />;
    }

    // Dostęp przyznany - VS
    return children;
}

export default ProtectedRoute;
