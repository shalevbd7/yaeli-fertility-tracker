"use client";

import { useCallback, useEffect, useState } from 'react';

export type AccountRole = 'owner' | 'partner' | 'pending' | 'none';

export type Account = {
  user: { name: string; email: string };
  role: AccountRole;
  isTestAccount: boolean;
  partner: { name: string; email: string } | null;
  owner: { name: string } | null;
  pendingRequests: Array<{ id: string; name: string; email: string; requestedAt: string | null }>;
  invite: { state: 'active' | 'expired' | 'awaiting-approval'; expiresAt: string | null } | null;
};

const POLL_MS = 60_000;

/**
 * Loads /api/me on mount and every 60s while the tab is visible (and when it
 * becomes visible again), for the pending-requests badge and role changes.
 */
export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [accountError, setAccountError] = useState(false);

  const refreshAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to load account');
      setAccount(await res.json());
      setAccountError(false);
    } catch (err) {
      console.error('Account load failed:', err);
      setAccountError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refreshAccount();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshAccount();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAccount();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshAccount]);

  return { account, accountError, refreshAccount };
}
