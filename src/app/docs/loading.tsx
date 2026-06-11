export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 space-y-4">
          <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
