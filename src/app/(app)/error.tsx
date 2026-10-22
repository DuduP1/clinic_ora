"use client";

import { useEffect } from "react";
import { btn } from "@/components/ui";

/** שגיאה לא צפויה במסך – הודעה ברורה ואפשרות לנסות שוב, בלי לאבד את הניווט */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-lg font-bold text-red-800">משהו השתבש בטעינת המסך</h1>
      <p className="mt-1 text-sm text-red-700">ייתכן שיש בעיית חיבור. הנתונים שלך שמורים – נסי לטעון שוב.</p>
      <button type="button" onClick={() => retry()} className={`${btn.primary} mt-4`}>
        טעינה מחדש
      </button>
    </div>
  );
}
