export default function QuizBatchesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-1 h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}