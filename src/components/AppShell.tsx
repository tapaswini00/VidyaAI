import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Search, BookOpen, Clock, User } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "../lib/LanguageContext";

const NAV_PATHS = [
  { path: "/", icon: Home, key: "home" },
  { path: "/search", icon: Search, key: "search" },
  { path: "/history", icon: Clock, key: "history" },
  { path: "/library", icon: BookOpen, key: "library" },
  { path: "/profile", icon: User, key: "profile" },
];

export default function AppShell() {
  const location = useLocation();
  const t = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_PATHS.map(({ path, icon: Icon, key }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl relative">
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-purple-500/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    active ? "text-purple-600" : "text-slate-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium relative z-10 transition-colors ${
                    active ? "text-purple-600" : "text-slate-500"
                  }`}
                >
                  {t(key)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
