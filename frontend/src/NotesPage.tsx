import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';

/** Keep the placeholder private until the server confirms a live session. */
export function NotesPage(): React.JSX.Element {
  const { status } = useAuth();
  if (status === 'checking') return <p role="status">Checking your session.</p>;
  if (status === 'unavailable')
    return <p role="alert">Unable to verify your session. Please try again.</p>;
  if (status !== 'authenticated')
    return <Navigate to="/login?expired=1" replace />;
  return (
    <section>
      <h1>Your notes</h1>
      <p role="status">Your notes will appear here.</p>
    </section>
  );
}
