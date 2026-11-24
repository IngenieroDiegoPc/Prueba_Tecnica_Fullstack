 import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  changeOrderStatus,
  createOrder,
  listAvailableProducts,
  listCustomerOptions,
  listOrders,
} from '../api/orders'
import { apiError } from '../api/client'

const STATUS_LABEL = { CREATED: 'Creada', PAID: 'Pagada', CANCELLED: 'Cancelada' }
const STATUS_STYLE = {
  CREATED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
}
const money = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const EMPTY_FORM = { customerId: '', notes: '', productId: '', quantity: 1, lines: [] }

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    Promise.all([listCustomerOptions(), listAvailableProducts()])
      .then(([c, p]) => {
        setCustomers(c)
        setProducts(p)
      })
      .catch((e) => setError(apiError(e)))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listOrders({
        page,
        size: 5,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
      })
      setOrders(data.content)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(apiError(e))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, customerFilter])

  useEffect(() => {
    load()
  }, [load])

  const productById = (id) => products.find((p) => String(p.id) === String(id))

  function addLine() {
    const errs = { ...fieldErrors }
    delete errs.line
    const qty = Number(form.quantity)
    if (!form.productId) errs.line = 'Selecciona un producto.'
    else if (!Number.isInteger(qty) || qty < 1) errs.line = 'La cantidad debe ser un entero mayor o igual a 1.'
    setFieldErrors(errs)
    if (errs.line) return

    const exists = form.lines.find((l) => String(l.productId) === String(form.productId))
    const lines = exists
      ? form.lines.map((l) => (l === exists ? { ...l, quantity: l.quantity + qty } : l))
      : [...form.lines, { productId: Number(form.productId), quantity: qty }]
    setForm({ ...form, lines, productId: '', quantity: 1 })
  }

  function removeLine(productId) {
    setForm({ ...form, lines: form.lines.filter((l) => l.productId !== productId) })
  }

  const estimated = form.lines.reduce(
    (sum, l) => sum + Number(productById(l.productId)?.price ?? 0) * l.quantity,
    0,
  )

  function validate() {
    const errs = {}
    if (!form.customerId) errs.customerId = 'Selecciona un cliente.'
    if (form.lines.length === 0) errs.lines = 'Agrega al menos un producto.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    setOk('')
    if (!validate()) return
    try {
      const created = await createOrder({
        customerId: Number(form.customerId),
        notes: form.notes || null,
        items: form.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      })
      setOk(`Orden ${created.orderNumber} creada. Total calculado por el servidor: ${money(created.total)}.`)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setPage(0)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  async function changeStatus(order, status) {
    setError('')
    setOk('')
    const verb = status === 'PAID' ? 'marcar como pagada' : 'cancelar'
    if (!window.confirm(`¿Seguro que quieres ${verb} la orden ${order.orderNumber}?`)) return
    try {
      await changeOrderStatus(order.id, status)
      setOk(`Orden ${order.orderNumber}: estado cambiado a ${STATUS_LABEL[status]}.`)
      load()
    } catch (err) {
      setError(apiError(err))
    }
  }

  const input = 'w-full rounded border border-slate-300 px-3 py-2'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Órdenes</h1>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-white"
          onClick={() => { setShowForm(!showForm); setFieldErrors({}) }}
        >
          {showForm ? 'Cerrar formulario' : 'Nueva orden'}
        </button>
      </div>

      {error && <div className="rounded bg-red-100 px-4 py-2 text-red-800">{error}</div>}
      {ok && <div className="rounded bg-green-100 px-4 py-2 text-green-800">{ok}</div>}

      {showForm && (
        <form onSubmit={save} noValidate className="space-y-4 rounded border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Cliente *</label>
              <select className={input} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Seleccionar...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
              {fieldErrors.customerId && <p className="text-sm text-red-600">{fieldErrors.customerId}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Observaciones</label>
              <input className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="rounded border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium">Productos de la orden *</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <select className={input} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  <option value="">Seleccionar producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <input type="number" min="1" className={input} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <button type="button" className="rounded border border-indigo-600 px-4 py-2 text-indigo-600" onClick={addLine}>
                Agregar
              </button>
            </div>
            {fieldErrors.line && <p className="mt-1 text-sm text-red-600">{fieldErrors.line}</p>}
            {fieldErrors.lines && <p className="mt-1 text-sm text-red-600">{fieldErrors.lines}</p>}

            {form.lines.length > 0 && (
              <table className="mt-3 w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr><th className="p-2">Producto</th><th className="p-2">Cantidad</th><th className="p-2">Precio</th><th className="p-2"></th></tr>
                </thead>
                <tbody>
                  {form.lines.map((l) => {
                    const p = productById(l.productId)
                    return (
                      <tr key={l.productId} className="border-t">
                        <td className="p-2">{p?.name}</td>
                        <td className="p-2">{l.quantity}</td>
                        <td className="p-2">{money(p?.price ?? 0)}</td>
                        <td className="p-2"><button type="button" className="text-red-600" onClick={() => removeLine(l.productId)}>Quitar</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <p className="mt-2 text-sm text-slate-600">
              Total estimado: <strong>{money(estimated)}</strong> (el total definitivo lo calcula el servidor al guardar).
            </p>
          </div>

          <button className="rounded bg-indigo-600 px-4 py-2 text-white">Crear orden</button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <select className="rounded border border-slate-300 px-3 py-2" value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value) }}>
          <option value="">Todos los estados</option>
          <option value="CREATED">Creadas</option>
          <option value="PAID">Pagadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
        <select className="rounded border border-slate-300 px-3 py-2" value={customerFilter} onChange={(e) => { setPage(0); setCustomerFilter(e.target.value) }}>
          <option value="">Todos los clientes</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
        </select>
      </div>

      <table className="w-full overflow-hidden rounded border border-slate-200 bg-white text-left">
        <thead className="bg-slate-100 text-sm">
          <tr>
            <th className="p-2">Número</th><th className="p-2">Cliente</th><th className="p-2">Estado</th>
            <th className="p-2">Total</th><th className="p-2">Fecha</th><th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="6" className="p-4 text-center text-slate-500">Cargando...</td></tr>}
          {!loading && orders.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">Sin resultados.</td></tr>}
          {!loading && orders.map((o) => (
            <Fragment key={o.id}>
              <tr className="border-t">
                <td className="p-2">{o.orderNumber}</td>
                <td className="p-2">{o.customerName}</td>
                <td className="p-2">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                </td>
                <td className="p-2">{money(o.total)}</td>
                <td className="p-2">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                <td className="space-x-3 p-2">
                  <button className="text-indigo-600" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    {expanded === o.id ? 'Ocultar' : 'Ver detalle'}
                  </button>
                  {o.status === 'CREATED' && (
                    <>
                      <button className="text-green-700" onClick={() => changeStatus(o, 'PAID')}>Pagar</button>
                      <button className="text-red-600" onClick={() => changeStatus(o, 'CANCELLED')}>Cancelar</button>
                    </>
                  )}
                </td>
              </tr>
              {expanded === o.id && (
                <tr className="bg-slate-50">
                  <td colSpan="6" className="p-3">
                    <p className="mb-2 text-sm text-slate-600">Observaciones: {o.notes || 'Sin observaciones'}</p>
                    <table className="w-full text-left text-sm">
                      <thead><tr><th className="p-1">Producto</th><th className="p-1">Código</th><th className="p-1">Cantidad</th><th className="p-1">Precio unitario</th><th className="p-1">Subtotal</th></tr></thead>
                      <tbody>
                        {o.items.map((i) => (
                          <tr key={i.productId} className="border-t">
                            <td className="p-1">{i.productName}</td>
                            <td className="p-1">{i.productCode}</td>
                            <td className="p-1">{i.quantity}</td>
                            <td className="p-1">{money(i.unitPrice)}</td>
                            <td className="p-1">{money(i.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
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