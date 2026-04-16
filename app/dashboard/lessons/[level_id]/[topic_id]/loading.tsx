export default function LessonPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted mb-1" />
        <div className="h-7 w-72 animate-pulse rounded-md bg-muted" />
        <div className="mt-1 h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}