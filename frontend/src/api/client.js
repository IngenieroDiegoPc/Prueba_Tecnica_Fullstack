import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
})

export function apiError(error) {
  if (!error.response) return 'No se pudo conectar con el servidor.'
  const data = error.response.data
  if (Array.isArray(data?.details) && data.details.length) {
    return data.details
      .map((d) => (typeof d === 'string' ? d : `${d.field ?? ''} ${d.message ?? ''}`.trim()))
      .join(' · ')
  }
  return data?.message || 'Error inesperado.'
}