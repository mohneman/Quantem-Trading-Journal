import { useMemo, useState, type ReactNode } from "react";
import { ModalContext, type ModalName, type ModalPayload } from "../../context/ModalContext";
import { NewAccountModal } from "../modals/NewAccountModal";
import { AddBacktestModal } from "../modals/AddBacktestModal";
import { AddPayoutModal } from "../modals/AddPayoutModal";
import { AddTradeModal } from "../modals/AddTradeModal";
import { NewDayModal } from "../modals/NewDayModal";
import { ProfileSettingsModal } from "../modals/ProfileSettingsModal";
import { TradeViewModal } from "../modals/TradeViewModal";
import { TradeOutcomeModal } from "../modals/TradeOutcomeModal";
import { ChecklistSettingsModal } from "../modals/ChecklistSettingsModal";
import { HelpModal, UpgradeModal } from "../modals/HelpModal";

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpenName] = useState<ModalName>(null);
  const [payload, setPayload] = useState<ModalPayload | null>(null);

  const value = useMemo(
    () => ({
      open,
      payload,
      setOpen: (name: ModalName, next?: ModalPayload) => {
        setOpenName(name);
        setPayload(next ?? null);
      },
    }),
    [open, payload]
  );

  const close = () => {
    setOpenName(null);
    setPayload(null);
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {open === "account" || open === "propAccount" ? (
        <NewAccountModal onClose={close} prop={open === "propAccount"} accountId={payload?.accountId} />
      ) : null}
      {open === "backtest" ? <AddBacktestModal onClose={close} backtestId={payload?.backtestId} /> : null}
      {open === "payout" ? <AddPayoutModal onClose={close} payoutId={payload?.payoutId} /> : null}
      {open === "trade" ? <AddTradeModal onClose={close} tradeId={payload?.tradeId} initialDate={payload?.date} /> : null}
      {open === "newDay" || open === "editDay" ? (
        <NewDayModal onClose={close} journalId={payload?.journalId} initialDate={payload?.date} />
      ) : null}
      {open === "profile" ? <ProfileSettingsModal onClose={close} /> : null}
      {open === "tradeView" && payload?.tradeId ? (
        <TradeViewModal onClose={close} tradeId={payload.tradeId} />
      ) : null}
      {open === "tradeOutcome" && payload?.tradeId ? (
        <TradeOutcomeModal onClose={close} tradeId={payload.tradeId} />
      ) : null}
      {open === "checklist" ? <ChecklistSettingsModal onClose={close} /> : null}
      {open === "help" ? <HelpModal onClose={close} /> : null}
      {open === "upgrade" ? <UpgradeModal onClose={close} /> : null}
    </ModalContext.Provider>
  );
}
