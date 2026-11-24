import { api } from './client'

export const listCategories = (params) => api.get('/categories', { params }).then((r) => r.data)
export const createCategory = (body) => api.post('/categories', body).then((r) => r.data)
export const updateCategory = (id, body) => api.put(`/categories/${id}`, body).then((r) => r.data)