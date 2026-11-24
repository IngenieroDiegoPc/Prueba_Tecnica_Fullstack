 import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import CustomersPage from './pages/CustomersPage'
import CategoriesPage from './pages/CategoriesPage'
import ProductsPage from './pages/ProductsPage'

const Soon = ({ name }) => <p className="text-slate-500">{name}: próximamente.</p>

const link = ({ isActive }) =>
  `rounded px-3 py-2 ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-200'}`

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex gap-2 border-b bg-white px-6 py-3">
        <NavLink to="/customers" className={link}>Clientes</NavLink>
        <NavLink to="/categories" className={link}>Categorías</NavLink>
        <NavLink to="/products" className={link}>Productos</NavLink>
        <NavLink to="/orders" className={link}>Órdenes</NavLink>
      </nav>
      <main className="mx-auto max-w-5xl p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<Soon name="Órdenes" />} />
        </Routes>
      </main>
    </div>
  )
}