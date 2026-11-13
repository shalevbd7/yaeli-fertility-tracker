'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

type Phase = 'checking' | 'invalid' | 'ready' | 'sent' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-invite': 'הקישור אינו בתוקף יותר. בקשו קישור הזמנה חדש.',
  'invalid-input': 'נא למלא שם, אימייל תקין וסיסמה של 8 תווים לפחות.',
  'signup-failed': 'לא ניתן להשלים את ההרשמה עם הפרטים האלה. אם כבר יש לך חשבון, התחבר/י ואז פתח/י שוב את הקישור.',
  'own-invite': 'זה קישור ההזמנה שלך עצמך – שלחי אותו לבן/בת הזוג.',
  'already-linked': 'החשבון הזה כבר מחובר למעקב משותף.',
  'request-pending': 'כבר שלחת בקשת הצטרפות שממתינה לאישור.',
  'rate-limited': 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.',
};

function messageFor(code: string | undefined) {
  return (code && ERROR_MESSAGES[code]) || 'משהו השתבש. נסו שוב בעוד רגע.';
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === 'string' ? params.token : '';
  const router = useRouter();
  const { data: session, status } = useSession();

  const [phase, setPhase] = useState<Phase>('checking');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signup' | 'choose'>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/invites/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 429) {
          setError(messageFor('rate-limited'));
          setPhase('error');
          return;
        }
        setPhase(data?.valid ? 'ready' : 'invalid');
      } catch {
        if (!cancelled) {
          setError(messageFor(undefined));
          setPhase('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function acceptAsLoggedIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(messageFor(data?.error));
        if (data?.error === 'invalid-invite') setPhase('invalid');
        return;
      }
      setPhase('sent');
    } catch {
      setError(messageFor(undefined));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/invites/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(messageFor(data?.error));
        if (data?.error === 'invalid-invite') setPhase('invalid');
        return;
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        // The account exists and the request was sent; logging in can be done later.
        setPhase('sent');
        return;
      }
      setPhase('sent');
    } catch {
      setError(messageFor(undefined));
    } finally {
      setBusy(false);
    }
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-800 font-sans antialiased flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-400 to-pink-300 flex items-center justify-center text-white text-3xl shadow-md mx-auto mb-4">
            💞
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
            הזמנה למסע משותף
          </h1>
          <p className="text-sm text-rose-400 mt-2 font-medium">
            הוזמנת להצטרף למעקב המשותף ב&quot;המסע שלנו&quot;
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-rose-100 shadow-sm space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          {(phase === 'checking' || status === 'loading') && (
            <div className="text-center space-y-3 py-4">
              <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">בודקים את הקישור...</p>
            </div>
          )}

          {phase === 'invalid' && (
            <div className="text-center space-y-3">
              <p className="text-slate-700 font-semibold">הקישור אינו בתוקף.</p>
              <p className="text-sm text-slate-500">
                ייתכן שפג תוקפו (48 שעות), שכבר נעשה בו שימוש או שבוטל. בקשו מבעלת המעקב קישור חדש.
              </p>
            </div>
          )}

          {phase === 'sent' && (
            <div className="text-center space-y-4">
              <div className="text-4xl">⏳</div>
              <p className="text-slate-800 font-bold">בקשת ההצטרפות נשלחה!</p>
              <p className="text-sm text-slate-500">
                אחרי שבעלת המעקב תאשר את הבקשה, תוכל/י לראות ולערוך את המעקב המשותף.
              </p>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
              >
                המשך לאפליקציה
              </button>
            </div>
          )}

          {phase === 'ready' && status === 'authenticated' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-600">
                מחובר/ת כ-<strong dir="ltr">{session?.user?.email}</strong>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={acceptAsLoggedIn}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
              >
                {busy ? 'שולחים...' : 'שליחת בקשת הצטרפות ❤️'}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: `/invite/${token}` })}
                className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                זה לא החשבון הנכון? התנתקות
              </button>
            </div>
          )}

          {phase === 'ready' && status === 'unauthenticated' && mode === 'choose' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
              >
                יצירת חשבון חדש
              </button>
              <a
                href={loginHref}
                className="block w-full text-center bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold py-3 rounded-xl transition"
              >
                כבר יש לי חשבון – התחברות
              </a>
            </div>
          )}

          {phase === 'ready' && status === 'unauthenticated' && mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1.5">שם</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={60}
                  autoComplete="name"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">אימייל</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  dir="ltr"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">סיסמה (8 תווים לפחות)</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm"
                />
              </div>
              <div>
                <label htmlFor="password2" className="block text-sm font-bold text-slate-700 mb-1.5">אימות סיסמה</label>
                <input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
              >
                {busy ? 'יוצרים חשבון...' : 'הרשמה ושליחת בקשת הצטרפות'}
              </button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                חזרה
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ההצטרפות מתבצעת רק לאחר אישור בעלת המעקב
        </p>
      </div>
    </div>
  );
}
