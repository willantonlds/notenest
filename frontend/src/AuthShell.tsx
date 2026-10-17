import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext, type SessionStatus } from './auth-context';

/** Check the current server session and share logout across app routes. */
export function AuthShell({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState({
    key: '',
    status: 'checking' as SessionStatus,
  });
  const status =
    sessionState.key === location.key ? sessionState.status : 'checking';
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const key = location.key;
    const refresh = (): void => {
      setSessionState({ key, status: 'checking' });
      void fetch('/api/auth/me', { cache: 'no-store' })
        .then((response) => {
          if (active)
            setSessionState({
              key,
              status: response.ok
                ? 'authenticated'
                : response.status === 401
                  ? 'anonymous'
                  : 'unavailable',
            });
        })
        .catch(() => {
          if (active) setSessionState({ key, status: 'unavailable' });
        });
    };
    const onPageShow = (event: PageTransitionEvent): void => {
      if (event.persisted) refresh();
    };
    refresh();
    window.addEventListener('pageshow', onPageShow);
    return () => {
      active = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [location.key]);
  async function logout(): Promise<void> {
    setMessage('');
    try {
      const csrf = await fetch('/api/csrf', { cache: 'no-store' });
      if (!csrf.ok) throw new Error('CSRF request failed.');
      const { csrfToken } = (await csrf.json()) as { csrfToken: string };
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
          origin: window.location.origin,
        },
        body: '{}',
      });
      if (!response.ok) throw new Error('Logout request failed.');
      setSessionState({ key: location.key, status: 'anonymous' });
      navigate('/', { replace: true });
    } catch {
      setMessage('Logout is unavailable. Please try again.');
    }
  }

  return (
    <AuthContext.Provider value={{ status, message, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
