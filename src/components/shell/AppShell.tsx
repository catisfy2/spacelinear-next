"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      className="flex h-screen overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Sidebar />
      <div className="relative flex-1 overflow-hidden">
        <main className="flex-1 h-full relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.13, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
