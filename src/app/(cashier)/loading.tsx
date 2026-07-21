export default function CashierLoading() {
  return (
    <div className="flex min-h-screen bg-muted/50">
      <aside className="flex flex-col bg-muted/30 w-60 shrink-0 sticky top-0 h-screen px-2 py-3">
        <div className="flex items-center h-14 gap-3 px-3 mb-3">
          <div className="size-7 rounded-lg bg-muted-foreground/15 animate-pulse" />
          <div className="h-4 w-24 bg-muted-foreground/15 rounded animate-pulse" />
        </div>
        <div className="space-y-2 px-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 rounded-xl bg-muted-foreground/15 animate-pulse" />
          ))}
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-muted-foreground/15 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted-foreground/15 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-xl bg-muted-foreground/15 animate-pulse" />
        </div>
      </main>
    </div>
  );
}