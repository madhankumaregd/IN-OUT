import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export function useAuth({ required = false } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (required) router.replace('/login');
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [required, router]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, refetch: fetchUser };
}
