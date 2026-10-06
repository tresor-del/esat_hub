import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './toastContext';

const ToastControls = () => {
  const { toast } = useToast();

  return (
    <button onClick={() => toast({ message: 'Enregistré', duration: 1000 })}>
      Afficher le toast
    </button>
  );
};

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays a toast and removes it after its duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastControls />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Afficher le toast' }));

    expect(screen.getByText('Enregistré')).toHaveClass('toast-success');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Enregistré')).not.toBeInTheDocument();
  });

  it('renders the requested toast type', () => {
    const ErrorControl = () => {
      const { toast } = useToast();
      return <button onClick={() => toast({ message: 'Échec', type: 'error' })}>Afficher erreur</button>;
    };
    render(
      <ToastProvider>
        <ErrorControl />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Afficher erreur' }));

    expect(screen.getByText('Échec')).toHaveClass('toast-error');
  });
});
