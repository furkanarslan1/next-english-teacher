"use client";

export default function LevelTopicsError() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Bir hata oluştu</h2>
      <p className="text-sm text-muted-foreground">
        Konular yüklenirken bir sorun yaşandı. Lütfen sayfayı yenileyin.
      </p>
    </div>
  );
}