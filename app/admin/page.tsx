export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Hoş geldin, admin.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Seviyeler" value="—" />
        <StatCard title="Kategoriler" value="—" />
        <StatCard title="Kartlar" value="—" />
        <StatCard title="Testler" value="—" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
