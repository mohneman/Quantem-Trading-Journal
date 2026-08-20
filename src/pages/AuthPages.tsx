import { useEffect, useState, type FormEvent } from "react";
import { CircleAlert, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { APPROVAL_MSG, useStore } from "../store";
import { googleClientConfigured, signInWithGoogle } from "../lib/googleAuth";
import { peekReferralCode } from "../lib/referral";
import { LogoMark } from "../components/ui/Logo";
import { Modal } from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Field";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { session, login, googleContinue } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("nejahseid750@gmail.com");
  const [password, setPassword] = useState("quantum");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [googleOpen, setGoogleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  function finishGoogle(profile: { name: string; email: string }) {
    void (async () => {
      const res = await googleContinue(profile);
      if (res.awaitingApproval || res.error === APPROVAL_MSG) {
        setNotice(APPROVAL_MSG);
        setError("");
        return;
      }
      if (res.error) {
        setError(res.error);
        return;
      }
      nav("/", { replace: true });
    })();
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">Login</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter your credentials to sign in to your account</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const err = await login(email, password);
          if (err === APPROVAL_MSG) {
            setNotice(APPROVAL_MSG);
            setError("");
          } else if (err) {
            setError(err);
            setNotice("");
          } else {
            nav("/", { replace: true });
          }
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
        type="button"
        className="btn-ghost h-12 w-full"
        disabled={busy}
        onClick={async () => {
          setError("");
          if (!googleClientConfigured()) {
            setGoogleOpen(true);
            return;
          }
          setBusy(true);
          try {
            finishGoogle(await signInWithGoogle());
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (msg === "NO_CLIENT" || msg.includes("unavailable")) setGoogleOpen(true);
            else setError(msg || "Google sign-in failed.");
          } finally {
            setBusy(false);
          }
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
      {googleOpen ? (
        <GoogleAccountModal
          onClose={() => setGoogleOpen(false)}
          onContinue={(profile) => {
            setGoogleOpen(false);
            finishGoogle(profile);
          }}
        />
      ) : null}
      {notice ? <ApprovalPrompt message={notice} onClose={() => setNotice("")} /> : null}
    </AuthShell>
  );
}

export function SignupPage() {
  const { session, signup, googleContinue } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [googleOpen, setGoogleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    setRefCode(peekReferralCode());
  }, []);

  if (session) return <Navigate to="/" replace />;

  function finishGoogle(profile: { name: string; email: string }) {
    void (async () => {
      const res = await googleContinue(profile);
      if (res.awaitingApproval || res.error === APPROVAL_MSG) {
        setNotice(APPROVAL_MSG);
        setError("");
        return;
      }
      if (res.error) {
        setError(res.error);
        return;
      }
      nav("/", { replace: true });
    })();
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">Sign up</h1>
      <p className="mt-1 text-sm text-ink-muted">Create your Quantum journal. A super admin must approve access before you can log in.</p>
      {refCode ? (
        <p className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-sm text-brand">
          Referral code applied: <span className="font-mono font-semibold">{refCode}</span>
        </p>
      ) : null}
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await signup({ name, email, password });
          if (res.awaitingApproval || res.error === APPROVAL_MSG) {
            setNotice(APPROVAL_MSG);
            setError("");
          } else if (res.error) {
            setError(res.error);
            setNotice("");
          }
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
      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.14em] text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        OR CONTINUE WITH
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        className="btn-ghost h-12 w-full"
        disabled={busy}
        onClick={async () => {
          setError("");
          if (!googleClientConfigured()) {
            setGoogleOpen(true);
            return;
          }
          setBusy(true);
          try {
            finishGoogle(await signInWithGoogle());
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (msg === "NO_CLIENT" || msg.includes("unavailable")) setGoogleOpen(true);
            else setError(msg || "Google sign-in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <GoogleMark /> Continue with Google
      </button>
      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand">
          Login
        </Link>
      </p>
      {googleOpen ? (
        <GoogleAccountModal
          onClose={() => setGoogleOpen(false)}
          onContinue={(profile) => {
            setGoogleOpen(false);
            finishGoogle(profile);
          }}
        />
      ) : null}
      {notice ? <ApprovalPrompt message={notice} onClose={() => setNotice("")} /> : null}
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
      <p className="mt-1 text-sm text-ink-muted">Enter your email. We'll email a reset code when mail is available, and also show it here.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await requestReset(email);
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
  const [notice, setNotice] = useState("");
  if (session) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <h1 className="text-3xl font-bold text-ink">New password</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter the reset code from the previous step.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const err = await resetPassword(email, token, password);
          if (err === APPROVAL_MSG) {
            setNotice(APPROVAL_MSG);
            setError("");
          } else if (err) {
            setError(err);
          } else {
            nav("/", { replace: true });
          }
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
      {notice ? <ApprovalPrompt message={notice} onClose={() => setNotice("")} /> : null}
    </AuthShell>
  );
}

function ApprovalPrompt({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <Modal title="Account pending" subtitle="A super admin has to approve this account first." onClose={onClose} glow>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15">
          <CircleAlert size={18} />
        </span>
        <p className="text-sm font-medium text-ink dark:text-white">{message}</p>
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="gradient" onClick={onClose}>
          OK
        </Button>
      </div>
    </Modal>
  );
}

function GoogleAccountModal({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: (profile: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and Google email are required.");
      return;
    }
    onContinue({ name: name.trim(), email: email.trim() });
  }

  return (
    <Modal title="Continue with Google" subtitle="Use the Google account you want to register." onClose={onClose} glow>
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Google email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradient" type="submit">
            Continue
          </Button>
        </div>
      </form>
    </Modal>
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
            <IconChip className="animate-float-slow -mb-4 rotate-[-8deg] bg-violet-100 text-violet-500">📈</IconChip>
            <IconChip className="animate-float bg-sky-100 text-sky-500">🕒</IconChip>
            <IconChip className="animate-float-delayed -mb-6 rotate-[8deg] bg-amber-100 text-amber-500">📄</IconChip>
            <IconChip className="animate-float bg-emerald-100 text-emerald-500">$</IconChip>
          </div>
          <div className="flex flex-col items-center gap-2">
            <LogoMark size={56} />
            <p className="text-2xl font-bold tracking-tight text-[#0F1B2D]">Quantum</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">Trading Journal</p>
          </div>
          <h2 className="mt-8 max-w-md text-4xl font-extrabold leading-tight text-[#0F1B2D]">
            Trade Smarter Track Better. Perform Stronger.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            Monitor targets and performance insights all in one place anytime, anywhere.
          </p>
        </div>
        <p className="absolute bottom-8 text-xs text-ink-faint">
          Created for traders, with passion and love! Powered by Amiinhub.
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
