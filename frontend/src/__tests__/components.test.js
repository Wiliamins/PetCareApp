/**
 * PetCareApp - Frontend Tests
 * Tests for React components
 * @author VS
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

// Components
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Test wrapper with providers - VS
const TestWrapper = ({ children }) => (
    <BrowserRouter>
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    </BrowserRouter>
);

// Button Tests - VS
describe('Button Component', () => {
    test('renders button with text', () => {
        render(<Button>Click me</Button>, { wrapper: TestWrapper });
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    test('handles click events', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Click me</Button>, { wrapper: TestWrapper });
        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('applies variant classes', () => {
        const { container } = render(<Button variant="primary">Primary</Button>, { wrapper: TestWrapper });
        expect(container.querySelector('.btn-primary')).toBeInTheDocument();
    });

    test('applies size classes', () => {
        const { container } = render(<Button size="small">Small</Button>, { wrapper: TestWrapper });
        expect(container.querySelector('.btn-small')).toBeInTheDocument();
    });

    test('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>, { wrapper: TestWrapper });
        expect(screen.getByText('Disabled')).toBeDisabled();
    });

    test('shows loading state', () => {
        render(<Button loading>Loading</Button>, { wrapper: TestWrapper });
        expect(screen.getByText('Loading')).toBeDisabled();
    });

    test('applies fullWidth class', () => {
        const { container } = render(<Button fullWidth>Full Width</Button>, { wrapper: TestWrapper });
        expect(container.querySelector('.btn-full-width')).toBeInTheDocument();
    });
});

// Card Tests - VS
describe('Card Component', () => {
    test('renders card with children', () => {
        render(<Card>Card content</Card>, { wrapper: TestWrapper });
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('renders card with title', () => {
        render(<Card title="Card Title">Content</Card>, { wrapper: TestWrapper });
        expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    test('applies variant classes', () => {
        const { container } = render(<Card variant="elevated">Content</Card>, { wrapper: TestWrapper });
        expect(container.querySelector('.card-elevated')).toBeInTheDocument();
    });

    test('applies hoverable class', () => {
        const { container } = render(<Card hoverable>Content</Card>, { wrapper: TestWrapper });
        expect(container.querySelector('.card-hoverable')).toBeInTheDocument();
    });
});

// Input Tests - VS
describe('Input Component', () => {
    test('renders input with label', () => {
        render(<Input label="Email" />, { wrapper: TestWrapper });
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    test('handles value changes', () => {
        const handleChange = jest.fn();
        render(<Input onChange={handleChange} />, { wrapper: TestWrapper });
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalled();
    });

    test('displays error message', () => {
        render(<Input error="This field is required" />, { wrapper: TestWrapper });
        expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('applies error class when error exists', () => {
        const { container } = render(<Input error="Error" />, { wrapper: TestWrapper });
        expect(container.querySelector('.input-error')).toBeInTheDocument();
    });

    test('renders different input types', () => {
        render(<Input type="password" data-testid="password-input" />, { wrapper: TestWrapper });
        const input = screen.getByTestId('password-input');
        expect(input).toHaveAttribute('type', 'password');
    });

    test('handles placeholder', () => {
        render(<Input placeholder="Enter text" />, { wrapper: TestWrapper });
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });
});

// LoadingSpinner Tests - VS
describe('LoadingSpinner Component', () => {
    test('renders loading spinner', () => {
        const { container } = render(<LoadingSpinner />, { wrapper: TestWrapper });
        expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('renders with custom size', () => {
        const { container } = render(<LoadingSpinner size="large" />, { wrapper: TestWrapper });
        expect(container.querySelector('.spinner-large')).toBeInTheDocument();
    });
});

// Integration Tests - VS
describe('Form Integration', () => {
    test('form submission flow', async () => {
        const handleSubmit = jest.fn();
        
        render(
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <Input label="Name" name="name" />
                <Input label="Email" name="email" type="email" />
                <Button type="submit">Submit</Button>
            </form>,
            { wrapper: TestWrapper }
        );

        const nameInput = screen.getAllByRole('textbox')[0];
        const emailInput = screen.getAllByRole('textbox')[1];
        
        fireEvent.change(nameInput, { target: { value: 'John' } });
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
        fireEvent.click(screen.getByText('Submit'));

        expect(handleSubmit).toHaveBeenCalled();
    });
});
