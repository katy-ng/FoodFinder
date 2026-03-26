import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserSession } from '../types';
import * as auth from '../lib/auth';

interface AuthContextValue {
  user: UserSession | null;
  signUp: (email: string, password: string, displayName: string) => ReturnType<typeof auth.signUp>;
  signIn: (email: string, password: string) => ReturnType<typeof auth.signIn>;
  signOut: () => void;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserSession | null>(() => auth.getSession());

  const signUp = useCallback((email: string, password: string, displayName: string) => {
    const r = auth.signUp(email, password, displayName);
    if (r.ok) setUserState(auth.getSession());
    return r;
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const r = auth.signIn(email, password);
    if (r.ok) setUserState(auth.getSession());
    return r;
  }, []);

  const signOut = useCallback(() => {
    auth.signOut();
    setUserState(null);
  }, []);

  const value = useMemo(
    () => ({ user, signUp, signIn, signOut }),
    [user, signUp, signIn, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
