import { LifeBuoy } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help & Support" onClose={onClose} glow icon={<LifeBuoy size={20} className="text-purple-brand" />}>
      <div className="space-y-3 text-sm text-ink-muted">
        <p>Quantum Trading Journal keeps your journal on this device with localStorage. Every page and modal is unlocked locally.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Demo trader: nejahseid750@gmail.com / quantum</li>
          <li>Super admin: admin@quantum.local / quantum-admin — then open Settings to manage users.</li>
          <li>Add trades from Trading Journal, then log WIN / LOSS / BE with realized P&amp;L from View or Log outcome.</li>
          <li>Custom checklists are created here and used in Add Trade and Add Backtest.</li>
          <li>Position Calculator sizes lots from balance, risk %, and stop-loss pips.</li>
          <li>Export payouts as CSV from Payout Journal, and print analytics as PDF.</li>
        </ul>
        <p>Powered by Sunmax Inc.</p>
      </div>
    </Modal>
  );
}

export function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Upgrade Plan" subtitle="Quantum local journal" onClose={onClose} glow>
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
