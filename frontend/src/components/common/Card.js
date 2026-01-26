/**
 * PetCareApp - Komponent Card
 * Uniwersalna karta do wyświetlania treści
 * @author VS
 */

import React from 'react';
import './Card.css';

/**
 * Komponent karty
 * @param {Object} props - Właściwości
 * @param {React.ReactNode} props.children - Zawartość karty
 * @param {string} props.title - Tytuł karty
 * @param {string} props.subtitle - Podtytuł
 * @param {React.ReactNode} props.icon - Ikona w nagłówku
 * @param {React.ReactNode} props.actions - Akcje w nagłówku
 * @param {string} props.variant - Wariant (default, elevated, outlined, flat)
 * @param {boolean} props.hoverable - Czy z efektem hover
 * @param {boolean} props.clickable - Czy klikalny
 * @param {function} props.onClick - Handler kliknięcia
 * @param {string} props.className - Dodatkowe klasy
 */
function Card({
    children,
    title,
    subtitle,
    icon,
    actions,
    variant = 'default',
    hoverable = false,
    clickable = false,
    onClick,
    className = '',
    ...rest
}) {
    const cardClasses = [
        'card',
        `card-${variant}`,
        hoverable && 'card-hoverable',
        clickable && 'card-clickable',
        className
    ].filter(Boolean).join(' ');

    const CardElement = clickable ? 'button' : 'div';

    return (
        <CardElement
            className={cardClasses}
            onClick={clickable ? onClick : undefined}
            {...rest}
        >
            {(title || icon || actions) && (
                <div className="card-header">
                    <div className="card-header-content">
                        {icon && <span className="card-icon">{icon}</span>}
                        <div className="card-titles">
                            {title && <h3 className="card-title">{title}</h3>}
                            {subtitle && <p className="card-subtitle">{subtitle}</p>}
                        </div>
                    </div>
                    {actions && <div className="card-actions">{actions}</div>}
                </div>
            )}
            <div className="card-body">
                {children}
            </div>
        </CardElement>
    );
}

/**
 * Komponent stopki karty
 */
function CardFooter({ children, className = '' }) {
    return (
        <div className={`card-footer ${className}`}>
            {children}
        </div>
    );
}

Card.Footer = CardFooter;

export default Card;
