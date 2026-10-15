import { API_BASE_URL } from '../config'

const TOKEN_KEY = 'rr_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/**
 * Call the API. Every response is { success, message, data, errors? }.
 *   api('/reports/mine.php')
 *   api('/auth/login.php', { method: 'POST', body: { email, password } })
 *   api('/reports/create.php', { method: 'POST', body: formData })   // FormData for photos
 * Returns `data`; throws ApiError (with .errors per field) when success is false.
 */
export async function api(path, { method = 'GET', body, query } = {}) {
  let url = API_BASE_URL + path
  if (query) {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null))
    if ([...params].length) url += (url.includes('?') ? '&' : '?') + params
  }
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: payload })
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_BASE_URL}. Is XAMPP (Apache + MySQL) running?`, 0)
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new ApiError(`The server sent something that is not JSON (HTTP ${res.status}). Check the PHP file for errors.`, res.status)
  }

  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event('auth:expired'))
  }
  if (!json.success) throw new ApiError(json.message || 'Request failed', res.status, json.errors || {})
  return json.data
}
