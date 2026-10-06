import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('../utils/axiosConfig', () => ({
  default: { get: mocks.get, post: mocks.post },
  API_BASE_URL: 'http://api.test',
}));

import { getPosts, getUserProfile, login } from './api';

describe('main API service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads a user profile from the user endpoint', async () => {
    mocks.get.mockResolvedValue({ data: { id: 'user-12', first_name: 'Ada' } });

    await expect(getUserProfile('user-12')).resolves.toEqual({ id: 'user-12', first_name: 'Ada' });
    expect(mocks.get).toHaveBeenCalledWith('/users/user-12');
  });

  it('sends login credentials as form data and persists returned tokens', async () => {
    const tokens = { access_token: 'access-token', refresh_token: 'refresh-token' };
    mocks.post.mockResolvedValue({ data: tokens });

    await expect(login('student', 'secret')).resolves.toEqual(tokens);

    const [path, body, options] = mocks.post.mock.calls[0];
    expect(path).toBe('/auth/token');
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get('username')).toBe('student');
    expect(body.get('password')).toBe('secret');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
  });

  it('serializes post list filters as query parameters', async () => {
    mocks.get.mockResolvedValue({ data: { items: [] } });

    await getPosts({ skip: 10, limit: 5, postType: 'photo', myPost: true, roomId: 'room-4' });

    const requestUrl = mocks.get.mock.calls[0][0];
    const query = new URLSearchParams(requestUrl.slice(requestUrl.indexOf('?') + 1));
    expect(requestUrl.startsWith('/posts/?')).toBe(true);
    expect(query.get('skip')).toBe('10');
    expect(query.get('limit')).toBe('5');
    expect(query.get('post_type')).toBe('photo');
    expect(query.get('my_posts')).toBe('true');
    expect(query.get('room_id')).toBe('room-4');
  });
});
