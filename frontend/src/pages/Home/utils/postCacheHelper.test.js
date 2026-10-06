import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { incrementPostCommentCount } from './postCacheHelper';

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('incrementPostCommentCount', () => {
  it('increments the matching post in all cached post pages', () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(['posts', 'home'], {
      pages: [
        { posts: [{ id: 'first', comments_count: 2 }, { id: 'other', comments_count: 4 }] },
        { posts: [{ id: 'first', comments_count: 1 }] },
      ],
    });
    queryClient.setQueryData(['profile', 'user-1'], { posts: [] });

    incrementPostCommentCount(queryClient, 'first', 3);

    expect(queryClient.getQueryData(['posts', 'home']).pages).toEqual([
      { posts: [{ id: 'first', comments_count: 5 }, { id: 'other', comments_count: 4 }] },
      { posts: [{ id: 'first', comments_count: 4 }] },
    ]);
    expect(queryClient.getQueryData(['profile', 'user-1'])).toEqual({ posts: [] });
  });

  it('starts a missing comment count at zero before incrementing', () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(['posts'], {
      pages: [{ posts: [{ id: 'new-post' }] }],
    });

    incrementPostCommentCount(queryClient, 'new-post');

    expect(queryClient.getQueryData(['posts']).pages[0].posts[0].comments_count).toBe(1);
  });

  it('does nothing when no post query is cached', () => {
    const queryClient = createQueryClient();

    expect(() => incrementPostCommentCount(queryClient, 'missing')).not.toThrow();
  });
});
