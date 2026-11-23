export function Loading() {
  return <p className="py-8 text-center text-slate-500">Cargando...</p>
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="my-4 flex items-center justify-between rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ text }) {
  return <p className="py-8 text-center text-slate-500">{text}</p>
}