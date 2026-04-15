export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoş Geldin!</h1>
        <p className="text-muted-foreground text-sm">
          Kartlarını incele, testleri çöz ve ilerlemeni takip et.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Çalışılan Kart</p>
          <p className="mt-1 text-3xl font-bold">—</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Tamamlanan Test</p>
          <p className="mt-1 text-3xl font-bold">—</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Toplam Puan</p>
          <p className="mt-1 text-3xl font-bold">—</p>
        </div>
      </div>
    </div>
  );
}