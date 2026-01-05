"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
          router.refresh();
        },
      },
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="group flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-red-500/10"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
          <LogOut className="h-5 w-5" />
        </div>
        <span className="font-medium text-red-500 group-hover:text-red-400">
          Sair da Conta
        </span>
      </div>
    </button>
  );
}
