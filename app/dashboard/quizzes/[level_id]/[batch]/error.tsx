"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function QuizSessionError({ reset }: { error: Error; reset: () => void }) {
  const params = useParams();
  const levelId = params?.level_id as string | undefined;

  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-2xl">⚠️</p>
      <p className="font-medium">Test yüklenirken bir hata oluştu.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
          Tekrar dene
        </button>
        {levelId && (
          <Link
            href={`/dashboard/quizzes/${levelId}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Testlere dön
          </Link>
        )}
      </div>
    </div>
  );
}