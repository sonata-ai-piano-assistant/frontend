import { Suspense } from 'react'

import OAuthRedirectInner from "@/components/auth/OAuthRedirectInner";


export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <OAuthRedirectInner />
    </Suspense>
  );
}
