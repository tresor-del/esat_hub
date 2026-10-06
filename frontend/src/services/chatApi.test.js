import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../utils/axiosConfig', () => ({
  default: { get: mocks.get, put: mocks.put, post: mocks.post },
  API_BASE_URL: 'http://api.test',
}));

import {
  getAllUsers,
  getChatHistory,
  getRecentChat,
  getUnreadMsgTotal,
  markMessagesAsReadApi,
  uploadChatFile,
} from './chatApi';

describe('chat API service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests chat history with and without a pagination cursor', async () => {
    mocks.get.mockResolvedValue({ data: [{ id: 'message-1' }] });

    await expect(getChatHistory('user-7')).resolves.toEqual([{ id: 'message-1' }]);
    expect(mocks.get).toHaveBeenLastCalledWith('/chat/history/user-7', { params: {} });

    await getChatHistory('user-7', 'cursor-1');
    expect(mocks.get).toHaveBeenLastCalledWith('/chat/history/user-7', {
      params: { before: 'cursor-1' },
    });
  });

  it('loads recent chats, unread totals and the user directory', async () => {
    mocks.get.mockResolvedValue({ data: [] });

    await getRecentChat();
    await getUnreadMsgTotal();
    await getAllUsers();

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/chat/recent');
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/chat/unread-total');
    expect(mocks.get).toHaveBeenNthCalledWith(3, '/users/all');
  });

  it('marks a recipient conversation as read', async () => {
    mocks.put.mockResolvedValue({ data: { success: true } });

    await expect(markMessagesAsReadApi('user-7')).resolves.toEqual({ success: true });
    expect(mocks.put).toHaveBeenCalledWith('/chat/read/user-7');
  });

  it('uploads chat files as multipart form data', async () => {
    mocks.post.mockResolvedValue({ data: { url: '/uploads/file.pdf' } });
    const payload = new FormData();
    payload.append('file', new File(['document'], 'file.pdf', { type: 'application/pdf' }));

    await expect(uploadChatFile(payload)).resolves.toEqual({ url: '/uploads/file.pdf' });
    expect(mocks.post).toHaveBeenCalledWith('/files/chat/upload', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });
});
