import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ModalProvider } from "./ModalProvider";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const lockPage = pathname === "/calendar";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <ModalProvider>
      <div
        className={`bg-canvas bg-mesh dark:bg-[#0b0f14] ${
          lockPage ? "h-dvh overflow-hidden" : "min-h-dvh"
        }`}
      >
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className={`min-w-0 ${lockPage ? "h-full lg:pl-[280px]" : "lg:pl-[280px]"}`}>
          <main
            className={`${
              lockPage ? "flex h-full min-h-0 flex-col overflow-hidden" : "overflow-visible"
            } min-w-0 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-4 lg:px-6`}
          >
            <Outlet context={{ onMenu: () => setOpen(true) }} />
          </main>
        </div>
      </div>
    </ModalProvider>
  );
}

export type LayoutCtx = { onMenu: () => void };
