import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => ({
  apiLogin: vi.fn(),
  apiLogout: vi.fn(),
  getUserProfile: vi.fn(),
  isAuthenticated: vi.fn(),
  jwtDecode: vi.fn(),
  initFCM: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  axiosPost: vi.fn(),
}));

vi.mock('axios', () => ({ default: { post: mocks.axiosPost } }));
vi.mock('jwt-decode', () => ({ jwtDecode: mocks.jwtDecode }));
vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: mocks.get, set: mocks.set, remove: mocks.remove },
}));
vi.mock('../utils/axiosConfig', () => ({ API_BASE_URL: 'http://api.test' }));
vi.mock('../services/api', () => ({
  login: mocks.apiLogin,
  logout: mocks.apiLogout,
  isAuthenticated: mocks.isAuthenticated,
  getUserProfile: mocks.getUserProfile,
}));
vi.mock('../lib/fcmService', () => ({ initFCM: mocks.initFCM }));

const AuthControls = () => {
  const { user, loading, isAuth, login, logout } = useAuth();

  return (
    <div>
      <span>{loading ? 'loading' : 'ready'}</span>
      <span>{isAuth() ? `authenticated:${user.id}` : 'anonymous'}</span>
      <button onClick={() => login('student', 'secret')}>Sign in</button>
      <button onClick={logout}>Sign out</button>
    </div>
  );
};

const renderAuth = () => render(
  <AuthProvider>
    <AuthControls />
  </AuthProvider>,
);

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ value: null });
    mocks.set.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
    mocks.initFCM.mockResolvedValue(undefined);
  });

  it('restores an authenticated session from a valid stored access token', async () => {
    mocks.get.mockImplementation(async ({ key }) => ({
      value: key === 'access_token' ? 'valid-token' : null,
    }));
    mocks.jwtDecode.mockReturnValue({ sub: 'user-17', exp: Date.now() / 1000 + 3600 });
    mocks.getUserProfile.mockResolvedValue({ id: 'user-17', first_name: 'Ada' });

    renderAuth();

    expect(await screen.findByText('authenticated:user-17')).toBeInTheDocument();
    expect(mocks.getUserProfile).toHaveBeenCalledWith('user-17');
  });

  it('persists tokens and loads the profile after a successful login', async () => {
    mocks.apiLogin.mockResolvedValue({ access_token: 'access', refresh_token: 'refresh' });
    mocks.jwtDecode.mockReturnValue({ sub: 'user-23' });
    mocks.getUserProfile.mockResolvedValue({ id: 'user-23', first_name: 'Grace' });

    renderAuth();
    await screen.findByText('ready');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('authenticated:user-23')).toBeInTheDocument();
    expect(mocks.set).toHaveBeenCalledWith({ key: 'access_token', value: 'access' });
    expect(mocks.set).toHaveBeenCalledWith({ key: 'refresh_token', value: 'refresh' });
    expect(mocks.set).toHaveBeenCalledWith({ key: 'username', value: 'student' });
    expect(mocks.initFCM).toHaveBeenCalledWith('user-23');
  });

  it('clears the session and stored credentials on logout', async () => {
    renderAuth();
    await screen.findByText('ready');
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    expect(mocks.apiLogout).toHaveBeenCalledOnce();
    expect(mocks.remove).toHaveBeenCalledWith({ key: 'access_token' });
    expect(mocks.remove).toHaveBeenCalledWith({ key: 'refresh_token' });
    expect(mocks.remove).toHaveBeenCalledWith({ key: 'username' });
  });
});
