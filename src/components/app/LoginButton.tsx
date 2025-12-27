"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginButton() {
  const { login, authenticated } = usePrivy();

  if (authenticated) {
    return null;
  }

  return (
    <button
      onClick={() => login()}
      className="w-auto flex items-center justify-center gap-2 px-4 py-3 primary-button rounded text-center font-medium text-sm transition-all"
    >
      Connect with Google
    </button>
  );
}
