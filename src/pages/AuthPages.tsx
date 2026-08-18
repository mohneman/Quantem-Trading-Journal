import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store";

export function LoginPage() {
  const { session, login, googleContinue } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("nejahseid750@gmail.com");
  const [password, setPassword] = useState("quantem");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  if (session) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">Login</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter your credentials to sign in to your account</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const err = login(email, password);
          if (err) setError(err);
          else nav("/", { replace: true });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Email <span className="text-loss">*</span></span>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Password <span className="text-loss">*</span></span>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input px-10"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <button type="submit" className="btn h-12 w-full bg-[#0F1B2D] text-white hover:bg-[#152238]">
          Login
        </button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.14em] text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        OR CONTINUE WITH
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        className="btn-ghost h-12 w-full"
        onClick={() => {
          googleContinue();
          nav("/", { replace: true });
        }}
      >
        <GoogleMark /> Continue with Google
      </button>
      <p className="mt-6 text-sm text-ink-muted">
        Forgot password?{" "}
        <Link to="/forgot" className="font-semibold text-ink">
          Reset it
        </Link>
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-brand">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignupPage() {
  const { session, signup } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (session) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">Sign up</h1>
      <p className="mt-1 text-sm text-ink-muted">Create your RyzeLog journal in seconds.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const err = signup({ name, email, password });
          if (err) setError(err);
          else nav("/", { replace: true });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Full name *</span>
          <div className="relative">
            <UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Email <span className="text-loss">*</span></span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Password <span className="text-loss">*</span></span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <button type="submit" className="btn h-12 w-full bg-[#0F1B2D] text-white hover:bg-[#152238]">
          Create account
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPage() {
  const { session, requestReset } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  if (session) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">Reset password</h1>
      <p className="mt-1 text-sm text-ink-muted">We'll generate a local reset code for this device.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const res = requestReset(email);
          if (res.error) {
            setError(res.error);
            setSent("");
          } else {
            setError("");
            setSent(res.token ?? "");
          }
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Email <span className="text-loss">*</span></span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {sent ? (
          <p className="rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand">
            Reset code: <b>{sent}</b>
          </p>
        ) : null}
        <button type="submit" className="btn h-12 w-full bg-[#0F1B2D] text-white">
          Send reset code
        </button>
      </form>
      {sent ? (
        <button className="mt-4 text-sm font-semibold text-brand" onClick={() => nav(`/reset?email=${encodeURIComponent(email)}&code=${sent}`)}>
          Continue to reset →
        </button>
      ) : null}
      <p className="mt-6 text-sm text-ink-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}

export function ResetPage() {
  const { session, resetPassword } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("code") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (session) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">New password</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter the reset code from the previous step.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const err = resetPassword(email, token, password);
          if (err) setError(err);
          else nav("/", { replace: true });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Email <span className="text-loss">*</span></span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Reset code *</span>
          <input className="input uppercase" value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">New password *</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <button type="submit" className="btn h-12 w-full bg-[#0F1B2D] text-white">
          Save password
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-white lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-pink-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />
        <div className="relative flex flex-col items-center px-12 text-center">
          <div className="mb-8 flex items-end gap-3">
            <IconChip className="-mb-4 rotate-[-8deg] bg-violet-100 text-violet-500">📈</IconChip>
            <IconChip className="bg-sky-100 text-sky-500">🕒</IconChip>
            <IconChip className="-mb-6 rotate-[8deg] bg-amber-100 text-amber-500">📄</IconChip>
            <IconChip className="bg-emerald-100 text-emerald-500">$</IconChip>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative h-8 w-8">
              <span className="absolute left-0 top-1 h-5 w-5 rounded-full bg-brand/90" />
              <span className="absolute right-0 top-2 h-5 w-5 rounded-full bg-purple-brand/90" />
            </span>
            <p className="text-2xl font-bold tracking-tight text-[#0F1B2D]">Ryze Log</p>
          </div>
          <h2 className="mt-8 max-w-md text-4xl font-extrabold leading-tight text-[#0F1B2D]">
            Trade Smarter Track Better. Perform Stronger.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            Monitor targets and performance insights all in one place anytime, anywhere.
          </p>
        </div>
        <p className="absolute bottom-8 text-xs text-ink-faint">
          Created for traders, with passion and love! Powered by Sunmax Inc.
        </p>
      </div>
      <div className="flex items-center justify-center bg-[#F4F6FA] px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function IconChip({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`grid h-14 w-14 place-items-center rounded-2xl text-xl shadow-soft ${className}`}>
      {children}
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.7 7.4l6.3 5.3C38.3 37.3 44 31.5 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
