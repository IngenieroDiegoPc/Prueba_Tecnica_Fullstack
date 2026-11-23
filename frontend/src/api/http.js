import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

// Convierte cualquier error de la API en un mensaje legible para el usuario.
export function errorMessage(error) {
  const data = error.response?.data
  if (data?.details && Object.keys(data.details).length > 0) {
    return Object.values(data.details).join('. ')
  }
  if (data?.message) return data.message
  if (error.code === 'ERR_NETWORK') return 'No se pudo conectar con el servidor'
  return 'Ocurrió un error inesperado'
}

export default http