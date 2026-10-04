import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SearchFilters from './SearchFilters';

describe('SearchFilters', () => {
  it('passes entered search text to the callback', () => {
    const onSearch = vi.fn();

    render(<SearchFilters onSearch={onSearch} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher sur Esat-Hub ...'), {
      target: { value: 'mathématiques' },
    });

    expect(onSearch).toHaveBeenCalledWith('mathématiques');
  });

  it('applies compact and chat variants when requested', () => {
    const { container } = render(<SearchFilters onSearch={vi.fn()} compact chat />);

    expect(container.querySelector('.search-filters-wrapper'))
      .toHaveClass('compact', 'chat-filter');
    expect(container.querySelector('.search-input-container-chat'))
      .toHaveClass('search-input-wrapper');
  });
});
