import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mocks = vi.hoisted(() => ({ login: vi.fn(), initFCM: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mocks.login, user: null }),
}));
vi.mock('../../lib/fcmService', () => ({ initFCM: mocks.initFCM }));

const renderLogin = () => render(
  <MemoryRouter>
    <Login />
  </MemoryRouter>,
);

describe('Login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports missing credentials without calling the auth provider', async () => {
    const { container } = renderLogin();

    fireEvent.submit(container.querySelector('form'));

    expect(await screen.findByText('Veuillez remplir tous les champs')).toBeInTheDocument();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('submits credentials and displays authentication errors', async () => {
    mocks.login.mockResolvedValue({ success: false, error: 'Identifiants invalides' });
    renderLogin();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'student' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'bad-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('student', 'bad-secret'));
    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument();
  });

  it('clears an existing error when the user edits a field', async () => {
    const { container } = renderLogin();
    fireEvent.submit(container.querySelector('form'));
    expect(await screen.findByText('Veuillez remplir tous les champs')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'student' } });

    expect(screen.queryByText('Veuillez remplir tous les champs')).not.toBeInTheDocument();
  });
});
