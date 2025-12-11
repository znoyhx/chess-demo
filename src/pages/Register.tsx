import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [nickname, setNickname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nickname,
            email_for_display: email,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }
      }

      navigate("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-stone-100 to-amber-200 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/90 p-10 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold text-center text-stone-900 mb-2">Create Account</h1>
        <p className="text-center text-sm text-stone-500 mb-8">Forge your commander identity and join the battle.</p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-sm font-medium text-stone-700">
              Commander Name
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Create a secure password"
            />
            {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-amber-600 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Forging..." : "Join the Battle"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-stone-600">
          Already have a commander? <Link to="/login" className="font-semibold text-amber-600 hover:text-amber-700">Sign In</Link>
        </div>
      </div>
    </div>
  );
};
