import React, { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export const Login: React.FC = () => {
  const [nickname, setNickname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // Step 1 — Try signing the player up.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // options.data is persisted to user_metadata, which travels with every auth response.
          // By writing the nickname here we can display it immediately after login without
          // creating a separate profile table or additional fetch calls.
          data: {
            full_name: nickname,
            email_for_display: email,
          },
        },
      });

      if (error) {
        // Step 2 — If the email already exists, fall back to a password login.
        if (error.message.includes("User already registered")) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw signInError;
          }
        } else {
          throw error;
        }
      } else if (!data.session) {
        // Safety net: email confirmation is disabled, but guard for unexpected configs.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      }

      // Successful authentication — AuthContext will pick up the new session and redirect.
    } catch (unknownError) {
      const authError = unknownError as AuthError;
      setErrorMessage(authError.message ?? "Unexpected authentication error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-stone-100 to-amber-200 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/90 p-10 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold text-center text-stone-900 mb-2">
          Xiangqi Online
        </h1>
        <p className="text-center text-sm text-stone-500 mb-8">
          Pick your commander name and enter the battlefield instantly.
        </p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-sm font-medium text-stone-700">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              autoComplete="nickname"
              required
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="e.g. Scarlet General"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Enter a secure password"
            />
            {errorMessage ? (
              <p className="text-xs text-red-500">{errorMessage}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-amber-600 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Starting..." : "Start Game"}
          </button>
        </form>
      </div>
    </div>
  );
};
