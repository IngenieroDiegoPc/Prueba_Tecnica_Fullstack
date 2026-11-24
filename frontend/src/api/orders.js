import { api } from './client'

export const listOrders = (params) => api.get('/orders', { params }).then((r) => r.data)
export const createOrder = (body) => api.post('/orders', body).then((r) => r.data)
export const changeOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data)

// Datos para los selectores del formulario
export const listCustomerOptions = () =>
  api.get('/customers', { params: { size: 100 } }).then((r) => r.data.content)
export const listAvailableProducts = () =>
  api.get('/products', { params: { size: 100, available: true } }).then((r) => r.data.content)