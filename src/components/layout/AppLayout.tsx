import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ModalProvider } from "./ModalProvider";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const lockPage = pathname === "/calendar";

  return (
    <ModalProvider>
      <div className={`bg-canvas bg-mesh dark:bg-[#0b0f14] ${lockPage ? "h-dvh overflow-hidden" : "min-h-screen"}`}>
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className={lockPage ? "h-full lg:pl-[250px]" : "lg:pl-[250px]"}>
          <main className={`${lockPage ? "flex h-full min-h-0 flex-col overflow-hidden" : "overflow-visible"} px-3 py-3 sm:px-6 sm:py-4`}>
            <Outlet context={{ onMenu: () => setOpen(true) }} />
          </main>
        </div>
      </div>
    </ModalProvider>
  );
}

export type LayoutCtx = { onMenu: () => void };
