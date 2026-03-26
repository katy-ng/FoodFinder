import { useId, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export function Account() {
  const { user, signUp, signIn, signOut } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const errId = useId();

  if (user) {
    return (
      <section className="panel account-panel" aria-labelledby="account-heading">
        <h2 id="account-heading">Account</h2>
        <div className="account-card">
          <p className="account-card__name">{user.displayName}</p>
          <p className="muted">{user.email}</p>
          <p className="fine-print">
            This is a demo sign-in: data stays in your browser only. For a real deployment, use University SSO or
            verified email magic links.
          </p>
          <button type="button" className="btn btn--secondary" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </section>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const r =
      mode === 'up' ? signUp(email, password, displayName) : signIn(email, password);
    if (!r.ok) setError(r.error);
    else {
      setPassword('');
      if (mode === 'up') setDisplayName('');
    }
  };

  return (
    <section className="panel account-panel" aria-labelledby="account-heading">
      <h2 id="account-heading">Account</h2>
      <p className="muted">
        Sign in with your <strong>@stonybrook.edu</strong> email to personalize FoodFinder (demo: stored locally in
        this browser).
      </p>
      <div className="segmented" role="tablist" aria-label="Sign in or sign up">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'in'}
          className={`segmented__btn${mode === 'in' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('in');
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'up'}
          className={`segmented__btn${mode === 'up' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('up');
            setError(null);
          }}
        >
          Sign up
        </button>
      </div>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {mode === 'up' ? (
          <label className="field">
            <span className="field__label">Display name</span>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="field">
          <span className="field__label">Email</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errId : undefined}
          />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
            required
            minLength={mode === 'up' ? 8 : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errId : undefined}
          />
        </label>
        {error ? (
          <p id={errId} className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {mode === 'up' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
