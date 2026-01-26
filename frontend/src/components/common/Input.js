/**
 * PetCareApp - Komponent Input
 * Uniwersalne pole formularza
 * @author VS
 */

import React, { useState } from 'react';
import './Input.css';

/**
 * Komponent pola input
 * @param {Object} props - Właściwości
 * @param {string} props.type - Typ pola
 * @param {string} props.label - Etykieta
 * @param {string} props.name - Nazwa pola
 * @param {string} props.value - Wartość
 * @param {string} props.placeholder - Placeholder
 * @param {string} props.error - Komunikat błędu
 * @param {string} props.hint - Podpowiedź
 * @param {boolean} props.required - Czy wymagane
 * @param {boolean} props.disabled - Czy wyłączone
 * @param {React.ReactNode} props.icon - Ikona
 * @param {function} props.onChange - Handler zmiany
 * @param {function} props.onBlur - Handler blur
 */
function Input({
    type = 'text',
    label,
    name,
    value,
    placeholder,
    error,
    hint,
    required = false,
    disabled = false,
    icon = null,
    onChange,
    onBlur,
    className = '',
    ...rest
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const wrapperClasses = [
        'input-wrapper',
        isFocused && 'focused',
        error && 'has-error',
        disabled && 'disabled',
        icon && 'has-icon',
        className
    ].filter(Boolean).join(' ');

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur && onBlur(e);
    };

    return (
        <div className={wrapperClasses}>
            {label && (
                <label htmlFor={name} className="input-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}
            
            <div className="input-container">
                {icon && <span className="input-icon">{icon}</span>}
                
                <input
                    type={inputType}
                    id={name}
                    name={name}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="input-field"
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
                    {...rest}
                />
                
                {type === 'password' && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                    >
                        {showPassword ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            
            {error && (
                <span id={`${name}-error`} className="input-error" role="alert">
                    {error}
                </span>
            )}
            
            {hint && !error && (
                <span id={`${name}-hint`} className="input-hint">
                    {hint}
                </span>
            )}
        </div>
    );
}

export default Input;
