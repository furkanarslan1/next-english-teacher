"use client";

export default function CardsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-2xl">⚠️</p>
      <p className="font-medium">Kartlar yüklenirken bir hata oluştu.</p>
      <button
        onClick={reset}
        className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
      >
        Tekrar dene
      </button>
    </div>
  );
}