import axios from 'axios'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'İstek zaman aşımına uğradı'
      }
      return 'Sunucuya ulaşılamadı'
    }
  }
  return 'Beklenmeyen bir hata oluştu'
}

export function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status
  }
  return undefined
}
