import './register.css';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

/** Accessible login form with generic credential and expiry feedback. */
export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const csrfResponse = await fetch('/api/csrf');
      const { csrfToken } = (await csrfResponse.json()) as {
        csrfToken: string;
      };
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? 'Invalid email or password.'
            : 'Login is unavailable. Try again.',
        );
        return;
      }
      navigate('/notes');
    } catch {
      setError('Login is unavailable. Try again.');
    }
  }
  return (
    <section>
      <h1>Welcome back</h1>
      {query.get('expired') === '1' && (
        <p role="status">Your session expired. Please log in again.</p>
      )}
      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit">Log in</button>
      </form>
      <p>
        New to NoteNest? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
