import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { GameProvider } from "../context/GameContext";
import { GamePage } from "./GamePage";

export const Game: React.FC = () => {
  const { user } = useAuth();

  const nickname = (user?.user_metadata?.full_name as string | undefined) ?? "Commander";
  const email = user?.email ?? "";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <GameProvider>
      <div className="relative min-h-screen">
        <GamePage />
        <div className="pointer-events-none fixed left-1/2 top-6 z-50 w-[min(92%,640px)] -translate-x-1/2">
          <div className="pointer-events-auto flex items-center justify-between rounded-2xl bg-white/90 px-5 py-3 shadow-xl backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-stone-800">Welcome, {nickname}</p>
              <p className="text-xs text-stone-500">Email: {email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </GameProvider>
  );
};
