export default function LevelTopicsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted mb-1" />
        <div className="h-7 w-52 animate-pulse rounded-md bg-muted" />
        <div className="mt-1 h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}