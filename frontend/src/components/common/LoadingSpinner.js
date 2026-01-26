/**
 * PetCareApp - Komponent LoadingSpinner
 * Animowany wskaźnik ładowania
 * @author VS
 */

import React from 'react';
import './LoadingSpinner.css';

/**
 * Komponent wskaźnika ładowania
 * @param {Object} props - Właściwości
 * @param {boolean} props.fullScreen - Czy wyświetlić na pełnym ekranie
 * @param {string} props.size - Rozmiar (small, medium, large)
 * @param {string} props.text - Tekst do wyświetlenia
 */
function LoadingSpinner({ fullScreen = false, size = 'medium', text = '' }) {
    const spinnerContent = (
        <div className={`spinner-container ${size}`}>
            <div className="spinner">
                <div className="paw-print">
                    <span className="pad pad-1"></span>
                    <span className="pad pad-2"></span>
                    <span className="pad pad-3"></span>
                    <span className="pad pad-main"></span>
                </div>
            </div>
            {text && <p className="spinner-text">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="spinner-overlay">
                {spinnerContent}
            </div>
        );
    }

    return spinnerContent;
}

export default LoadingSpinner;
