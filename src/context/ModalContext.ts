import { createContext, useContext } from "react";

export type ModalName =
  | "account"
  | "propAccount"
  | "backtest"
  | "payout"
  | "trade"
  | "newDay"
  | "editDay"
  | "profile"
  | "tradeView"
  | "tradeOutcome"
  | "checklist"
  | "help"
  | "upgrade"
  | null;

export type ModalPayload = {
  tradeId?: string;
  journalId?: string;
  accountId?: string;
  payoutId?: string;
  backtestId?: string;
  date?: string;
};

export type ModalContextValue = {
  open: ModalName;
  payload: ModalPayload | null;
  setOpen: (name: ModalName, payload?: ModalPayload) => void;
};

export const ModalContext = createContext<ModalContextValue>({
  open: null,
  payload: null,
  setOpen: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}
