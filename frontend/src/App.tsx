import { Link, Route, Routes } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { LoginPage } from './LoginPage';
import { LogoutControl } from './LogoutControl';
import { NotesPage } from './NotesPage';
import { RegisterPage } from './RegisterPage';

/** Render the public routes and the guarded notes placeholder. */
export function App(): React.JSX.Element {
  return (
    <AuthShell>
      <main className="shell">
        <header>
          <Link className="brand" to="/">
            NoteNest
          </Link>
          <span>Study, simply.</span>
          <LogoutControl />
        </header>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route
            path="/"
            element={
              <section>
                <p className="eyebrow">YOUR STUDY SPACE</p>
                <h1>
                  Good notes.
                  <br />
                  Clearer thinking.
                </h1>
                <p className="intro">
                  A calm place to collect what you learn and share it with your
                  campus.
                </p>
                <p className="notice">Your study space is getting ready.</p>
                <p>
                  <Link to="/register">Create an account</Link> ·{' '}
                  <Link to="/login">Log in</Link>
                </p>
              </section>
            }
          />
          <Route
            path="*"
            element={
              <section>
                <h1>Page not found</h1>
                <Link to="/">Back to NoteNest</Link>
              </section>
            }
          />
        </Routes>
        <footer>Made for the curious.</footer>
      </main>
    </AuthShell>
  );
}
