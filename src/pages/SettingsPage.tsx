import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Clock,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useMenu } from "../hooks";
import { useToast } from "../context/ToastContext";
import { useStore, type AuthUser, type UserRole, type UserStatus } from "../store";

type FormMode = "create" | "edit" | "password" | null;

export function SettingsPage() {
  const onMenu = useMenu();
  const {
    users,
    currentUser,
    adminCreateUser,
    adminUpdateUser,
    adminSetPassword,
    adminDeleteUser,
    adminResetUserData,
  } = useStore();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<FormMode>(null);
  const [target, setTarget] = useState<AuthUser | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...users]
      .sort(
        (a, b) =>
          Number(b.status === "pending") - Number(a.status === "pending") ||
          Number(b.role === "superadmin") - Number(a.role === "superadmin") ||
          a.name.localeCompare(b.name)
      )
      .filter((u) => {
        if (!needle) return true;
        return `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase().includes(needle);
      });
  }, [users, q]);

  const traders = users.filter((u) => u.role === "trader").length;
  const admins = users.filter((u) => u.role === "superadmin").length;
  const pending = users.filter((u) => u.status === "pending").length;
  const disabled = users.filter((u) => u.status === "disabled").length;

  function closeForm() {
    setMode(null);
    setTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        subtitle="Manage registered traders, roles, and access."
        onMenu={onMenu}
      />
      <div className="page-shell p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-[24px] bg-gradient-to-r from-teal-50 via-white to-violet-50 p-5 dark:from-brand/10 dark:via-transparent dark:to-violet-500/10">
          <div>
            <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              SUPER ADMIN
            </span>
            <h2 className="mt-2 text-2xl font-semibold dark:text-white">Registered users</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Approve new sign-ups, change passwords, and disable accounts. Users cannot log in until you approve them.
            </p>
          </div>
          <button
            className="btn-gradient shadow-[0_8px_22px_rgba(0,209,193,0.28)]"
            onClick={() => {
              setTarget(null);
              setMode("create");
            }}
          >
            <Plus size={16} /> Add User
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Total users" value={users.length} icon={<Users size={16} />} tint="from-teal-50 to-emerald-50" iconBg="bg-brand/15 text-brand" />
          <Kpi label="Pending approval" value={pending} icon={<Clock size={16} />} tint="from-amber-50 to-orange-50" iconBg="bg-amber-100 text-amber-600" />
          <Kpi label="Traders" value={traders} icon={<UserRound size={16} />} tint="from-sky-50 to-indigo-50" iconBg="bg-sky-100 text-sky-600" />
          <Kpi label="Super admins" value={admins} icon={<Shield size={16} />} tint="from-violet-50 to-fuchsia-50" iconBg="bg-violet-100 text-purple-brand" />
          <Kpi label="Disabled" value={disabled} icon={<Trash2 size={16} />} tint="from-rose-50 to-orange-50" iconBg="bg-rose-100 text-loss" />
        </div>

        <div className="relative mt-5">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="input pl-10"
            placeholder="Search name, email, or role..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-line bg-slate-50 text-[11px] uppercase tracking-wide text-ink-faint dark:border-[#243041] dark:bg-white/5">
              <tr>
                {["User", "Sign-in", "Role", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const self = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-b border-line last:border-0 dark:border-[#243041]">
                      <td className="px-4 py-3">
                        <p className="font-semibold capitalize dark:text-white">{u.name}</p>
                        <p className="text-xs text-ink-faint">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{u.provider === "google" ? "Google" : "Email"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === "superadmin" ? "grade" : "neutral"}>
                          {u.role === "superadmin" ? "Super Admin" : "Trader"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : u.status === "pending"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
                                : "bg-rose-50 text-loss dark:bg-red-500/15"
                          }`}
                        >
                          {u.status === "active" ? "Active" : u.status === "pending" ? "Pending" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{u.createdAt?.slice(0, 10) || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.status === "pending" ? (
                            <>
                              <button
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200"
                                onClick={async () => {
                                  const err = await adminUpdateUser(u.id, { status: "active" });
                                  toast(err || `${u.name} approved`, err ? "info" : "success");
                                }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-loss hover:bg-rose-100 dark:bg-red-500/15"
                                onClick={async () => {
                                  const err = await adminUpdateUser(u.id, { status: "disabled" });
                                  toast(err || `${u.name} rejected`, err ? "info" : "success");
                                }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10"
                            onClick={() => {
                              setTarget(u);
                              setMode("edit");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10"
                            onClick={() => {
                              setTarget(u);
                              setMode("password");
                            }}
                          >
                            <KeyRound size={12} /> Password
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10"
                            onClick={async () => {
                              if (!window.confirm(`Reset journal data for ${u.email}? Trades, notes, and accounts for this user will be replaced with a fresh seed.`)) return;
                              const err = await adminResetUserData(u.id);
                              toast(err || "Journal data reset", err ? "info" : "success");
                            }}
                          >
                            <RotateCcw size={12} /> Reset data
                          </button>
                          {!self && u.status !== "pending" ? (
                            <button
                              className="rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 hover:text-brand dark:hover:bg-white/10"
                              onClick={async () => {
                                const next: UserStatus = u.status === "active" ? "disabled" : "active";
                                const err = await adminUpdateUser(u.id, { status: next });
                                toast(err || (next === "disabled" ? "User disabled" : "User enabled"), err ? "info" : "success");
                              }}
                            >
                              {u.status === "active" ? "Disable" : "Enable"}
                            </button>
                          ) : null}
                          {!self ? (
                            <button
                              className="rounded-lg px-2 py-1 text-xs font-medium text-loss hover:bg-loss-soft"
                              onClick={async () => {
                                if (!window.confirm(`Delete ${u.email}? This removes their journal data.`)) return;
                                const err = await adminDeleteUser(u.id);
                                toast(err || "User deleted", err ? "info" : "success");
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mode === "create" || mode === "edit" ? (
        <UserFormModal
          mode={mode}
          user={target}
          onClose={closeForm}
          onSave={async (input) => {
            const err =
              mode === "create"
                ? await adminCreateUser(input)
                : await adminUpdateUser(target!.id, {
                    name: input.name,
                    email: input.email,
                    phone: input.phone,
                    role: input.role,
                  });
            if (err) {
              toast(err, "info");
              return false;
            }
            toast(mode === "create" ? "User created" : "User updated");
            return true;
          }}
        />
      ) : null}

      {mode === "password" && target ? (
        <PasswordModal
          user={target}
          onClose={closeForm}
          onSave={async (password) => {
            const err = await adminSetPassword(target.id, password);
            if (err) {
              toast(err, "info");
              return false;
            }
            toast("Password updated");
            return true;
          }}
        />
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tint,
  iconBg,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tint: string;
  iconBg: string;
}) {
  return (
    <article className={`rounded-2xl bg-gradient-to-br p-4 shadow-soft ${tint} dark:from-white/5 dark:to-white/0`}>
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-full ${iconBg}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold dark:text-white">{value}</p>
    </article>
  );
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  user: AuthUser | null;
  onClose: () => void;
  onSave: (input: { name: string; email: string; password: string; phone?: string; role: UserRole }) => boolean | Promise<boolean>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "trader");

  return (
    <Modal
      title={mode === "create" ? "Add User" : "Edit User"}
      subtitle={mode === "create" ? "Create a trader or another super admin." : user?.email}
      onClose={onClose}
      glow
    >
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        {mode === "create" ? (
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </Field>
        ) : null}
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="trader">Trader</option>
            <option value="superadmin">Super Admin</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={async () => {
              const ok = await onSave({ name, email, password, phone, role });
              if (ok) onClose();
            }}
          >
            {mode === "create" ? "Create user" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({
  user,
  onClose,
  onSave,
}: {
  user: AuthUser;
  onClose: () => void;
  onSave: (password: string) => boolean | Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title="Change password" subtitle={user.email} onClose={onClose} glow>
      <div className="space-y-4">
        <Field label="New password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
        </Field>
        <Field label="Confirm password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={async () => {
              if (password.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
              }
              if (password !== confirm) {
                setError("Passwords do not match.");
                return;
              }
              const ok = await onSave(password);
              if (ok) onClose();
            }}
          >
            Update password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
