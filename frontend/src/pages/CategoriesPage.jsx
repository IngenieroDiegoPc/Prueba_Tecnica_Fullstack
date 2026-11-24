import { useCallback, useEffect, useState } from 'react'
import { createCategory, listCategories, updateCategory } from '../api/categories'
import { apiError } from '../api/client'

const EMPTY = { id: null, name: '', description: '', status: 'ACTIVE' }

export default function CategoriesPage() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await listCategories({
        page,
        size: 5,
        search: search || undefined,
        status: status || undefined,
      })
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(apiError(e))
    }
  }, [page, search, status])

  useEffect(() => {
    load()
  }, [load])

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio.'
    else if (form.name.length > 100) errs.name = 'Máximo 100 caracteres.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setOk('')
    if (!validate()) return
    const body = { name: form.name.trim(), description: form.description, status: form.status }
    try {
      if (form.id) await updateCategory(form.id, body)
      else await createCategory(body)
      setOk(form.id ? 'Categoría actualizada.' : 'Categoría creada.')
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  async function toggle(c) {
    setError('')
    setOk('')
    const next = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateCategory(c.id, { name: c.name, description: c.description, status: next })
      setOk(`Categoría ${next === 'ACTIVE' ? 'activada' : 'desactivada'}.`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const input = 'w-full rounded border border-slate-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categorías</h1>

      {error && <div className="rounded bg-red-100 px-4 py-2 text-red-800">{error}</div>}
      {ok && <div className="rounded bg-green-100 px-4 py-2 text-green-800">{ok}</div>}

      <form onSubmit={save} noValidate className="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre *</label>
          <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <input className={input} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Activa</option>
            <option value="INACTIVE">Inactiva</option>
          </select>
        </div>
        <div className="flex gap-2 md:col-span-3">
          <button className="rounded bg-indigo-600 px-4 py-2 text-white">{form.id ? 'Guardar cambios' : 'Crear categoría'}</button>
          {form.id && (
            <button type="button" className="rounded border px-4 py-2" onClick={() => { setForm(EMPTY); setFieldErrors({}) }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="flex gap-3">
        <input className={input} placeholder="Buscar por nombre..." value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} />
        <select className="rounded border border-slate-300 px-3 py-2" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value) }}>
          <option value="">Todas</option>
          <option value="ACTIVE">Activas</option>
          <option value="INACTIVE">Inactivas</option>
        </select>
      </div>

      <table className="w-full overflow-hidden rounded border border-slate-200 bg-white text-left">
        <thead className="bg-slate-100 text-sm">
          <tr><th className="p-2">Nombre</th><th className="p-2">Descripción</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr>
        </thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-slate-500">Sin resultados.</td></tr>}
          {items.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.description}</td>
              <td className="p-2">{c.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}</td>
              <td className="space-x-3 p-2">
                <button className="text-indigo-600" onClick={() => setForm({ id: c.id, name: c.name, description: c.description ?? '', status: c.status })}>Editar</button>
                <button className="text-amber-600" onClick={() => toggle(c)}>{c.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3">
        <button disabled={page === 0} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(page - 1)}>Anterior</button>
        <span className="text-sm">Página {totalPages === 0 ? 0 : page + 1} de {totalPages}</span>
        <button disabled={page + 1 >= totalPages} className="rounded border px-3 py-1 disabled:opacity-40" onClick={() => setPage(page + 1)}>Siguiente</button>
      </div>
    </div>
  )
}