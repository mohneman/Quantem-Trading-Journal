import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help & Support" onClose={onClose}>
      <div className="space-y-3 text-sm text-ink-muted">
        <p>RyzeLog / Quantem keeps your journal on this device with localStorage.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Demo login: nejahseid750@gmail.com / quantem</li>
          <li>Add trades from Trading Journal, then set WIN/LOSS from View.</li>
          <li>Custom checklists are created here and used in Add Trade.</li>
          <li>Export analytics with Print / Save as PDF.</li>
        </ul>
        <p>Powered by Sunmax Inc.</p>
      </div>
    </Modal>
  );
}

export function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Upgrade Plan" subtitle="RyzeLog local demo" onClose={onClose}>
      <div className="space-y-3 text-sm text-ink-muted">
        <p>You are on the full local journal. Every page, modal, and CRUD action is unlocked on this device.</p>
        <p>Cloud sync and partner payouts will attach when a live backend is connected. Until then, data stays in this browser.</p>
        <Button variant="gradient" className="w-full" onClick={onClose}>
          Continue journaling
        </Button>
      </div>
    </Modal>
  );
}
