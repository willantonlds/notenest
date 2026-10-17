import { useAuth } from './auth-context';

/** Render a shared sign-out control whenever a server session is active. */
export function LogoutControl(): React.JSX.Element | null {
  const { status, logout, message } = useAuth();
  if (status !== 'authenticated' && !message) return null;
  return (
    <>
      {status === 'authenticated' && (
        <button type="button" onClick={() => void logout()}>
          Log out
        </button>
      )}
      {message && <span role="alert">{message}</span>}
    </>
  );
}
