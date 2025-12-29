// components/sign-in-button.tsx
"use client"; // Importante: tem de ser um componente de cliente

import { authClient } from "@/lib/auth-client";

export default function SignInButton() {
  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/", // Para onde o utilizador vai após o login
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
    >
      Entrar com Google
    </button>
  );
}
