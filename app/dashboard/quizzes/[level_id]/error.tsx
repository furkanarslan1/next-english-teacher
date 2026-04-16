"use client";

import Link from "next/link";

export default function QuizBatchesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/quizzes" className="hover:underline">Testler</Link>
      </div>
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="font-medium">Testler yüklenirken bir hata oluştu.</p>
        <div className="flex gap-3">
          <button onClick={reset} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Tekrar dene
          </button>
          <Link href="/dashboard/quizzes" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
            Seviyelere dön
          </Link>
        </div>
      </div>
    </div>
  );
}