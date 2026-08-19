import { Camera } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Field, Input } from "../ui/Field";
import { Button } from "../ui/Button";
import { useStore } from "../../store";
import { useToast } from "../../context/ToastContext";
import { useState } from "react";

export function ProfileSettingsModal({ onClose }: { onClose: () => void }) {
  const { data, updateProfile } = useStore();
  const { toast } = useToast();
  const user = data.profile;
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState("");

  return (
    <Modal title="Profile Settings" onClose={onClose} glow>
      <div className="flex flex-col items-center">
        {avatar ? (
          <img src={avatar} alt="" className="h-24 w-24 rounded-full object-cover shadow-soft ring-4 ring-brand/15" />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-gradient text-2xl font-bold text-white shadow-soft">
            {user.initials}
          </div>
        )}
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand/30 bg-violet-50 px-3 py-1.5 text-xs font-medium text-brand transition hover:-translate-y-0.5 hover:bg-violet-100 dark:bg-violet-500/15">
          <Camera size={14} /> Upload Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5_000_000) {
                setError("Image must be 5 MB or smaller.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setAvatar(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <p className="mt-1 text-[11px] text-ink-faint">JPG, PNG, WebP or GIF - Max 5 MB</p>
      </div>
      <div className="mt-6 space-y-4">
        <Field label="Full Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><Input value={user.email} readOnly className="bg-slate-100 dark:bg-white/10" /></Field>
        <Field label="Phone Number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <Button
          variant="gradient"
          className="w-full"
          onClick={() => {
            if (!name.trim()) {
              setError("Enter your full name.");
              return;
            }
            updateProfile({ name: name.trim(), phone, avatar });
            toast("Profile saved successfully!");
            onClose();
          }}
        >
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}
