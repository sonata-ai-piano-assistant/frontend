"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";

// This page is used as the OAuth redirect URI
// It extracts the token from the URL and updates the UserContext
function OAuthRedirectInner() {
  const router = useRouter();
  const { login } = useUser();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  useEffect(() => {
    if (token) {
      login(token);
      // Redirect to the dashboard or home page after login
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [router, token, login]);

  return <div className="flex min-h-screen items-center justify-center">Connexion en cours...</div>;
}

export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <OAuthRedirectInner />
    </Suspense>
  );
}
