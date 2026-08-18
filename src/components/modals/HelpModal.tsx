import { Modal } from "../ui/Modal";

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
