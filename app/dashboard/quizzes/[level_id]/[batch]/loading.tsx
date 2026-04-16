export default function QuizSessionLoading() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-36 animate-pulse rounded-xl border bg-muted" />
      <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}