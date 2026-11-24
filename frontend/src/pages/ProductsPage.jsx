import { useCallback, useEffect, useState } from 'react'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/products'
import { listCategories } from '../api/categories'
import { apiError } from '../api/client'

const EMPTY = { id: null, code: '', name: '', description: '', price: '', available: true, categoryId: '' }

export default function ProductsPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [availableFilter, setAvailableFilter] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    listCategories({ size: 100 })
      .then((d) => setCategories(d.content))
      .catch((e) => setError(apiError(e)))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listProducts({
        page,
        size: 5,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        available: availableFilter || undefined,
      })
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, availableFilter])

  useEffect(() => {
    load()
  }, [load])

  function validate() {
    const errs = {}
    if (!form.code.trim()) errs.code = 'El código es obligatorio.'
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio.'
    if (form.price === '' || Number(form.price) <= 0) errs.price = 'El precio debe ser mayor que 0.'
    if (!form.categoryId) errs.categoryId = 'Selecciona una categoría.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setOk('')
    if (!validate()) return
    const body = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      available: form.available,
      categoryId: Number(form.categoryId),
    }
    try {
      if (form.id) await updateProduct(form.id, body)
      else await createProduct(body)
      setOk(form.id ? 'Producto actualizado.' : 'Producto creado.')
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  async function remove(p) {
    setError('')
    setOk('')
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return
    try {
      await deleteProduct(p.id)
      setOk('Producto eliminado.')
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const input = 'w-full rounded border border-slate-300 px-3 py-2'
  const Err = ({ k }) => (fieldErrors[k] ? <p className="text-sm text-red-600">{fieldErrors[k]}</p> : null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Productos</h1>

      {error && <div className="rounded bg-red-100 px-4 py-2 text-red-800">{error}</div>}
      {ok && <div className="rounded bg-green-100 px-4 py-2 text-green-800">{ok}</div>}

      <form onSubmit={save} noValidate className="grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Código *</label>
          <input className={input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Err k="code" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre *</label>
          <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Err k="name" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría *</label>
          <select className={input} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.status === 'INACTIVE' ? ' (inactiva)' : ''}</option>
            ))}
          </select>
          <Err k="categoryId" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Precio *</label>
          <input type="number" step="0.01" className={input} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Err k="price" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <input className={input} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
          <span className="text-sm font-medium">Disponible</span>
        </label>
        <div className="flex gap-2 md:col-span-3">
          <button className="rounded bg-indigo-600 px-4 py-2 text-white">{form.id ? 'Guardar cambios' : 'Crear producto'}</button>
          {form.id && (
            <button type="button" className="rounded border px-4 py-2" onClick={() => { setForm(EMPTY); setFieldErrors({}) }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-3">
        <input className="flex-1 rounded border border-slate-300 px-3 py-2" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => { setPage(0); setSearch(e.target.value) }} />
        <select className="rounded border border-slate-300 px-3 py-2" value={categoryFilter} onChange={(e) => { setPage(0); setCategoryFilter(e.target.value) }}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-3 py-2" value={availableFilter} onChange={(e) => { setPage(0); setAvailableFilter(e.target.value) }}>
          <option value="">Toda disponibilidad</option>
          <option value="true">Disponibles</option>
          <option value="false">No disponibles</option>
        </select>
      </div>

      <table className="w-full overflow-hidden rounded border border-slate-200 bg-white text-left">
        <thead className="bg-slate-100 text-sm">
          <tr>
            <th className="p-2">Código</th><th className="p-2">Nombre</th><th className="p-2">Categoría</th>
            <th className="p-2">Precio</th><th className="p-2">Disponible</th><th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="6" className="p-4 text-center text-slate-500">Cargando...</td></tr>}
          {!loading && items.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">Sin resultados.</td></tr>}
          {!loading && items.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.code}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.categoryName}</td>
              <td className="p-2">{Number(p.price).toLocaleString('es-CO')}</td>
              <td className="p-2">{p.available ? 'Sí' : 'No'}</td>
              <td className="space-x-3 p-2">
                <button className="text-indigo-600" onClick={() => setForm({
                  id: p.id, code: p.code, name: p.name, description: p.description ?? '',
                  price: p.price, available: p.available, categoryId: p.categoryId,
                })}>Editar</button>
                <button className="text-red-600" onClick={() => remove(p)}>Eliminar</button>
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