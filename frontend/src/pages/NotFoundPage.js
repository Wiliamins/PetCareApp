/**
 * PetCareApp - Strona 404
 * @author VS
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import './NotFoundPage.css';

function NotFoundPage() {
    const { t } = useTranslation();

    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-illustration">🐕‍🦺</div>
                <h1 className="not-found-code">404</h1>
                <h2 className="not-found-title">{t('errors.404.title')}</h2>
                <p className="not-found-description">{t('errors.404.description')}</p>
                <Link to="/">
                    <Button size="large">{t('errors.404.button')}</Button>
                </Link>
            </div>
        </div>
    );
}

export default NotFoundPage;
