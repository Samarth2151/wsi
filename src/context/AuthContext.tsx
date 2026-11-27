import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  clearStoredAuthTokens,
  fetchMe,
  getStoredAccessToken,
  getStoredRefreshToken,
  login as requestLogin,
  storeAuthTokens,
} from '../api/client';
import type { AuthUser } from '../types/wms';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (!accessToken) {
      if (refreshToken) clearStoredAuthTokens();
      setIsLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setToken(accessToken);
    void fetchMe()
      .then((currentUser) => {
        if (!isCurrent) return;
        if (!currentUser.is_active) {
          clearStoredAuthTokens();
          setToken(null);
          setUser(null);
          return;
        }
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setUser(null);
        if (error instanceof ApiError && error.status === 401) {
          clearStoredAuthTokens();
          setToken(null);
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await requestLogin(username, password);
    storeAuthTokens(result.access, result.refresh);
    setToken(result.access);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuthTokens();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
