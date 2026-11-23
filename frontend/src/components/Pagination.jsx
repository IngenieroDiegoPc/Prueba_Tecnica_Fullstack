export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-sm">
      <button
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="rounded border px-3 py-1 disabled:opacity-40"
      >
        Anterior
      </button>
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="rounded border px-3 py-1 disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  )
}