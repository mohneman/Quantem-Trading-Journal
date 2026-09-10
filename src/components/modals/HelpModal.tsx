import { LifeBuoy } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useStore } from "../../store";

export function HelpModal({ onClose }: { onClose: () => void }) {
  const { storage } = useStore();
  const hosted = storage === "mysql";
  return (
    <Modal title="Help & Support" onClose={onClose} glow icon={<LifeBuoy size={20} className="text-purple-brand" />}>
      <div className="space-y-3 text-sm text-ink-muted">
        <p>
          {hosted
            ? "Quantum stores accounts and journals on the server so you can sign in from any device."
            : "Quantum is running in local mode on this device. Connect the MySQL API on cPanel to sync across browsers."}
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Demo trader: nejahseid750@gmail.com / quantum</li>
          <li>Super admin: admin@quantum.local / quantum-admin — then open Settings to manage users.</li>
          <li>Add trades from Trading Journal, then log WIN / LOSS / BE with realized P&amp;L from View or Log outcome.</li>
          <li>Custom checklists are created here and used in Add Trade and Add Backtest.</li>
          <li>Position Calculator sizes lots from balance, risk %, and stop-loss pips.</li>
          <li>Export payouts as CSV from Payout Journal, and print analytics as PDF.</li>
        </ul>
        <p>Powered by Amiinhub.</p>
      </div>
    </Modal>
  );
}
