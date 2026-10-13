import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../pages/LoginPage';
import '../i18n';

describe('LoginPage Component', () => {
  it('renders branding, trust points, and login card inputs', () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={handleLoginSuccess} />);

    // Branding & Header
    expect(
      screen.getByText(/Labour Department Single Sign-On/i)
    ).toBeInTheDocument();

    // Inputs
    expect(screen.getByLabelText(/Username, Email or Mobile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Trust Points
    expect(screen.getByText(/Single Secure Sign-On/i)).toBeInTheDocument();
    expect(screen.getByText(/Strictly Entitled Portals/i)).toBeInTheDocument();
    expect(screen.getByText(/Audited & Tamper-Proof/i)).toBeInTheDocument();
  });
});
