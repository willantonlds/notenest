import { Link, Route, Routes } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

/** Render the minimal public shell; feature routes are added in later issues. */
export function App(): React.JSX.Element {
  return (
    <main className="shell">
      <header>
        <Link className="brand" to="/">
          NoteNest
        </Link>
        <span>Study, simply.</span>
      </header>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/notes"
          element={
            <section>
              <h1>Your notes</h1>
              <p role="status">Your notes will appear here.</p>
            </section>
          }
        />
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
                <Link to="/register">Create an account</Link>
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
  );
}
