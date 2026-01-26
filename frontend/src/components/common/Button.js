/**
 * PetCareApp - Komponent Button
 * Uniwersalny komponent przycisku
 * @author VS
 */

import React from 'react';
import './Button.css';

/**
 * Komponent przycisku
 * @param {Object} props - Właściwości
 * @param {React.ReactNode} props.children - Zawartość przycisku
 * @param {string} props.variant - Wariant (primary, secondary, outline, ghost, danger)
 * @param {string} props.size - Rozmiar (small, medium, large)
 * @param {boolean} props.fullWidth - Czy na pełną szerokość
 * @param {boolean} props.loading - Czy w stanie ładowania
 * @param {boolean} props.disabled - Czy wyłączony
 * @param {string} props.type - Typ przycisku
 * @param {React.ReactNode} props.icon - Ikona
 * @param {string} props.iconPosition - Pozycja ikony (left, right)
 * @param {function} props.onClick - Handler kliknięcia
 * @param {string} props.className - Dodatkowe klasy CSS
 */
function Button({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    icon = null,
    iconPosition = 'left',
    onClick,
    className = '',
    ...rest
}) {
    const buttonClasses = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        icon && !children && 'btn-icon-only',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && (
                <span className="btn-spinner" aria-hidden="true"></span>
            )}
            {!loading && icon && iconPosition === 'left' && (
                <span className="btn-icon btn-icon-left">{icon}</span>
            )}
            {children && <span className="btn-text">{children}</span>}
            {!loading && icon && iconPosition === 'right' && (
                <span className="btn-icon btn-icon-right">{icon}</span>
            )}
        </button>
    );
}

export default Button;
