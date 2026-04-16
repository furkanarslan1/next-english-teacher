export default function CardsViewerLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-12 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />

      {/* Card skeleton */}
      <div
        className="relative mx-auto w-full animate-pulse rounded-2xl border bg-muted"
        style={{ height: 320 }}
      />

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="size-1.5 animate-pulse rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}