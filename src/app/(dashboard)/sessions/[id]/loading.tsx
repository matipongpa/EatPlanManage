export default function SessionDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-64 rounded-md bg-muted" />
          <div className="h-4 w-48 rounded-md bg-muted" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 space-y-3">
            <div className="h-5 w-32 rounded bg-muted" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 h-48 bg-muted/50" />
      </div>
    </div>
  )
}
