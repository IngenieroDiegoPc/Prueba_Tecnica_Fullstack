import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import CustomersPage from './pages/CustomersPage.jsx'

const links = [
  { to: '/customers', label: 'Clientes' },
  { to: '/categories', label: 'Categorías' },
  { to: '/products', label: 'Productos' },
  { to: '/orders', label: 'Órdenes' },
]

function Soon({ title }) {
  return <p className="text-slate-500">La pantalla de {title} se construye en el siguiente paso.</p>
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-3">
          <span className="text-lg font-semibold">Gestión comercial</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 text-sm ${isActive ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-slate-700'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/categories" element={<Soon title="categorías" />} />
          <Route path="/products" element={<Soon title="productos" />} />
          <Route path="/orders" element={<Soon title="órdenes" />} />
          <Route path="*" element={<p>Página no encontrada</p>} />
        </Routes>
      </main>
    </div>
  )
}