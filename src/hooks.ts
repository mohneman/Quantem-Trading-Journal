import { useOutletContext } from "react-router-dom";
import type { LayoutCtx } from "./components/layout/AppLayout";

export function useMenu() {
  return useOutletContext<LayoutCtx>().onMenu;
}
