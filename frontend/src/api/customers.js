import http from './http.js'

export const listCustomers = (params) => http.get('/customers', { params }).then((r) => r.data)
export const createCustomer = (data) => http.post('/customers', data).then((r) => r.data)
export const updateCustomer = (id, data) => http.put(`/customers/${id}`, data).then((r) => r.data)
export const deleteCustomer = (id) => http.delete(`/customers/${id}`)