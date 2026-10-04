import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DropdownMenu from './DropdownMenu';

const setViewportWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe('DropdownMenu', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    setViewportWidth(1024);
  });

  it('opens a desktop menu and closes it after selecting an item', () => {
    setViewportWidth(1024);
    const onSelect = vi.fn();
    render(
      <DropdownMenu trigger="Actions" align="right">
        <button onClick={onSelect}>Modifier</button>
      </DropdownMenu>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(document.querySelector('.dropdown-panel--right')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument();
  });

  it('shows the mobile fullscreen menu and closes it with the close button', () => {
    setViewportWidth(390);
    render(
      <DropdownMenu trigger="Options" title="Options du profil">
        <button>Paramètres</button>
      </DropdownMenu>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Options' }));

    expect(screen.getByRole('heading', { name: 'Options du profil' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(screen.queryByRole('heading', { name: 'Options du profil' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });
});
