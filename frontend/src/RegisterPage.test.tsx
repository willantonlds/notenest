/* @vitest-environment jsdom */
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

const navigate = vi.fn();
vi.mock('react-router-dom', async (load) => ({
  ...(await load<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));
describe('registration feedback', () => {
  beforeEach(() => {
    cleanup();
    navigate.mockReset();
  });
  it('shows password rule and redirects after successful registration', async () => {
    const fetcher = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'token' })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters.' }),
          { status: 400 },
        ),
      );
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'at least 8 characters',
    );
    fetcher.mockRestore();
  });
  it('navigates to own notes on success', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrfToken: 'token' })),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 201 }));
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/notes'));
    vi.restoreAllMocks();
  });
});
