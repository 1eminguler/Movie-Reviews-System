import axios from 'axios'

// Backend tarafından dönen Türkçe hata mesajlarının İngilizce karşılıkları
const ERROR_TRANSLATIONS: Record<string, string> = {
  'Kullanıcı adı veya şifre hatalı': 'Incorrect username or password',
  'Bu kullanıcı adı zaten kullanımda': 'That username is already taken',
  'Bu email zaten kullanımda': 'That email is already registered',
  'Kullanıcı adı veya email zaten kullanımda':
    'That username or email is already registered',
  'Film bulunamadı': 'Movie not found',
  'Bu filme zaten yorum yaptınız': "You've already reviewed this movie",
  'Yorum bulunamadı': 'Review not found',
  'Geçersiz veya süresi dolmuş token': 'Your session has expired. Sign in again',
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      if (ERROR_TRANSLATIONS[detail]) {
        return ERROR_TRANSLATIONS[detail]
      }
      if (status === 422) {
        return 'Please check the highlighted fields'
      }
      return detail
    }

    if (status === 422) {
      return 'Please check the highlighted fields'
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out'
      }
      return "Can't reach the server"
    }
  }
  return 'Something went wrong'
}

export function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status
  }
  return undefined
}
