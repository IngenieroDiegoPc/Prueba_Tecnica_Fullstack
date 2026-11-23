import { useCallback, useEffect, useState } from 'react'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../api/customers.js'
import { errorMessage } from '../api/http.js'
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx'
import Pagination from '../components/Pagination.jsx'

const emptyForm = { fullName: '', email: '', phone: '' }

function validate(form) {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'El nombre es obligatorio'
  if (!form.email.trim()) errors.email = 'El correo es obligatorio'
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Correo inválido'
  if (form.phone.length > 30) errors.phone = 'Máximo 30 caracteres'
  return errors
}

export default function CustomersPage() {
  const [pageData, setPageData] = useState(null)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [editing, setEditing] = useState(null) // null = cerrado, 'new' = nuevo, o el cliente a editar
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPageData(await listCustomers({ page, size: 10, search }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  function submitSearch(e) {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  function openNew() {
    setEditing('new')
    setForm(emptyForm)
    setFormErrors({})
    setFormError('')
    setNotice('')
  }

  function openEdit(customer) {
    setEditing(customer)
    setForm({ fullName: customer.fullName, email: customer.email, phone: customer.phone ?? '' })
    setFormErrors({})
    setFormError('')
    setNotice('')
  }

  function closeForm() {
    setEditing(null)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate(form)
    setFormErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      }
      if (editing === 'new') {
        await createCustomer(payload)
        setNotice('Cliente creado correctamente')
      } else {
        await updateCustomer(editing.id, payload)
        setNotice('Cliente actualizado correctamente')
      }
      closeForm()
      load()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`¿Eliminar a ${customer.fullName}? Sus órdenes se conservan.`)) return
    setNotice('')
    try {
      await deleteCustomer(customer.id)
      setNotice('Cliente eliminado correctamente')
      if (pageData.content.length === 1 && page > 0) setPage(page - 1)
      else load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none'

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button onClick={openNew} className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
          Nuevo cliente
        </button>
      </div>

      {notice && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800">{notice}</div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} noValidate className="mb-6 rounded border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">{editing === 'new' ? 'Nuevo cliente' : `Editar a ${editing.fullName}`}</h2>

          {formError && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              Nombre completo
              <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} />
              {formErrors.fullName && <span className="text-xs text-red-600">{formErrors.fullName}</span>}
            </label>
            <label className="text-sm">
              Correo electrónico
              <input name="email" value={form.email} onChange={handleChange} className={inputClass} />
              {formErrors.email && <span className="text-xs text-red-600">{formErrors.email}</span>}
            </label>
            <label className="text-sm">
              Teléfono
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
              {formErrors.phone && <span className="text-xs text-red-600">{formErrors.phone}</span>}
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={closeForm} className="rounded border px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <form onSubmit={submitSearch} className="mb-4 flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre o correo"
          className={`${inputClass} max-w-sm bg-white`}
        />
        <button type="submit" className="rounded border bg-white px-4 py-2 text-sm hover:bg-slate-100">
          Buscar
        </button>
      </form>

      {error && <ErrorMessage message={error} onRetry={load} />}

      {loading ? (
        <Loading />
      ) : pageData && pageData.content.length === 0 ? (
        <EmptyState text={search ? 'No hay clientes que coincidan con la búsqueda' : 'Aún no hay clientes registrados'} />
      ) : (
        pageData && (
          <>
            <div className="overflow-x-auto rounded border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Correo</th>
                    <th className="px-4 py-2">Teléfono</th>
                    <th className="px-4 py-2">Creado</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.content.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-4 py-2">{c.fullName}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2">{c.phone || '-'}</td>
                      <td className="px-4 py-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => openEdit(c)} className="mr-3 text-slate-700 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(c)} className="text-red-600 hover:underline">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pageData.totalPages} onChange={setPage} />
          </>
        )
      )}
    </section>
  )
}