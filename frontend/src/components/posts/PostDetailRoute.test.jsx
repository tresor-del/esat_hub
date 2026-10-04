import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import PostDetailRoute from './PostDetailRoute';

vi.mock('../../pages/posts/postDetail', () => ({
  default: () => <h1>Détail de la publication</h1>,
}));

const RouteState = () => {
  const location = useLocation();
  return <output>{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>;
};

const setViewportWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe('PostDetailRoute', () => {
  it('shows the detail page directly on mobile', () => {
    setViewportWidth(390);
    render(
      <MemoryRouter initialEntries={['/post-page/post-42']}>
        <Routes>
          <Route path="/post-page/:id" element={<PostDetailRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Détail de la publication' })).toBeInTheDocument();
  });

  it('returns desktop users to home with the post modal state', async () => {
    setViewportWidth(1280);
    render(
      <MemoryRouter initialEntries={['/post-page/post-42']}>
        <Routes>
          <Route path="/post-page/:id" element={<PostDetailRoute />} />
          <Route path="/" element={<RouteState />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('{"pathname":"/","state":{"openPostId":"post-42"}}')).toBeInTheDocument();
  });
});
