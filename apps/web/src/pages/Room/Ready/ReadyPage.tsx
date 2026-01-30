export function ReadyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray="276"
            className="text-primary animate-countdown"
          />
        </svg>
      </div>
      <p className="text-lg font-medium">Generating list...</p>
    </div>
  )
}
