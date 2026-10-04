import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

describe('ProtectedRoute', () => {
  const renderRoute = () => render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute>
              <h1>Contenu privé</h1>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<h1>Connexion</h1>} />
      </Routes>
    </MemoryRouter>,
  );

  it('shows a loading message while authentication is being checked', () => {
    mockUseAuth.mockReturnValue({ loading: true, isAuth: () => false });

    renderRoute();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    expect(screen.queryByText('Contenu privé')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuth: () => false });

    renderRoute();

    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuth: () => true });

    renderRoute();

    expect(screen.getByRole('heading', { name: 'Contenu privé' })).toBeInTheDocument();
  });
});
