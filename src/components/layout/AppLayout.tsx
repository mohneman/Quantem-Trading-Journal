import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ModalProvider } from "./ModalProvider";

export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <ModalProvider>
      <div className="min-h-screen bg-canvas bg-mesh dark:bg-[#0b0f14]">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-[250px]">
          <main className="px-3 py-4 sm:px-6 sm:py-6">
            <Outlet context={{ onMenu: () => setOpen(true) }} />
          </main>
        </div>
      </div>
    </ModalProvider>
  );
}

export type LayoutCtx = { onMenu: () => void };
