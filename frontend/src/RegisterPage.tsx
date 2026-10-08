import './register.css';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

/** Accessible registration form with safe server feedback. */
export function RegisterPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const csrf = await fetch('/api/csrf');
      const { csrfToken } = (await csrf.json()) as { csrfToken: string };
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          displayName: form.get('displayName'),
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error: string };
        setError(result.error);
        return;
      }
      navigate('/notes');
    } catch {
      setError('Registration is unavailable. Try again.');
    }
  }
  return (
    <section>
      <h1>Create your account</h1>
      <form onSubmit={submit}>
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          maxLength={80}
          required
        />
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit">Create account</button>
      </form>
    </section>
  );
}
