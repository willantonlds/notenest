import { createContext, useContext } from 'react';

/** Status returned by the server session check. */
export type SessionStatus =
  'checking' | 'authenticated' | 'anonymous' | 'unavailable';
/** Shared state and action available to authenticated app routes. */
type AuthState = {
  status: SessionStatus;
  message: string;
  logout: () => Promise<void>;
};
/** Session state shared by the shell and protected page controls. */
export const AuthContext = createContext<AuthState | null>(null);

/** Read the shared authenticated state from inside the app shell. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthShell is required.');
  return context;
}
