import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ChatPage from './ChatPage';

const mocks = vi.hoisted(() => ({
  getAllUsers: vi.fn(),
  getRecentChat: vi.fn(),
  markMessagesAsReadApi: vi.fn(),
  searchPosts: vi.fn(),
  refreshUnreadCount: vi.fn(),
  setUnreadChatsCount: vi.fn(),
  websocket: {
    unreadChatsCount: 0,
    refreshUnreadCount: vi.fn(),
    setUnreadChatsCount: vi.fn(),
    activeConvRef: { current: null },
    messages: [],
  },
}));

vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocket: () => mocks.websocket,
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'current-user', first_name: 'Current' } }),
}));
vi.mock('../../services/api', () => ({ searchPosts: mocks.searchPosts }));
vi.mock('../../services/chatApi', () => ({
  getAllUsers: mocks.getAllUsers,
  getRecentChat: mocks.getRecentChat,
  markMessagesAsReadApi: mocks.markMessagesAsReadApi,
}));
vi.mock('../../components/ui/Avatar', () => ({ default: ({ user }) => <span>{user.first_name} avatar</span> }));
vi.mock('../../components/chat/ChatBox', () => ({
  default: ({ recipient, onClose }) => (
    <section>
      <h2>Discussion avec {recipient.first_name}</h2>
      <button onClick={onClose}>Fermer la discussion</button>
    </section>
  ),
}));
vi.mock('../Home/components/HomeSidebar', () => ({ default: () => null }));

const CurrentLocation = () => {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
};

const renderChatPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CurrentLocation />
        <ChatPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.websocket.activeConvRef.current = null;
    mocks.getRecentChat.mockResolvedValue([]);
    mocks.getAllUsers.mockResolvedValue([
      { id: 'user-7', first_name: 'Grace', last_name: 'Hopper' },
    ]);
    mocks.markMessagesAsReadApi.mockResolvedValue({});
    mocks.websocket.refreshUnreadCount.mockResolvedValue(undefined);
  });

  it('switches to new message suggestions and opens the selected conversation', async () => {
    renderChatPage();

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau' }));
    const contact = await screen.findByText('Grace Hopper');
    fireEvent.click(contact);

    expect(await screen.findByRole('heading', { name: 'Discussion avec Grace' })).toBeInTheDocument();
    await waitFor(() => expect(mocks.markMessagesAsReadApi).toHaveBeenCalledWith('user-7'));
    expect(mocks.websocket.activeConvRef.current).toBe('user-7');
    expect(screen.getByTestId('location-search')).toHaveTextContent('user=user-7');
    expect(mocks.websocket.refreshUnreadCount).toHaveBeenCalledOnce();
  });

  it('returns to the empty conversation state when the chat is closed', async () => {
    renderChatPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau' }));
    fireEvent.click(await screen.findByText('Grace Hopper'));
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer la discussion' }));

    expect(await screen.findByRole('heading', { name: 'Sélectionnez une conversation' })).toBeInTheDocument();
    expect(mocks.websocket.activeConvRef.current).toBeNull();
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
  });
});
