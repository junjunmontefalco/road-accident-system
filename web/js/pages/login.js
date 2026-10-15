// FR-02 login. Owner: Jan Russel
import { api, saveSession } from '../api.js'
import { homeFor, redirectIfLoggedIn } from '../app.js'
import { $, busy, param, showAlert } from '../ui.js'

if (!redirectIfLoggedIn()) {
  const form = $('#login-form')
  if (param('registered')) showAlert($('#message'), 'Account created. You can log in now.', 'success')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    showAlert($('#message'), '')
    const email = form.email.value.trim()
    const password = form.password.value
    if (!email || !password) return showAlert($('#message'), 'Enter your email and password')
    await busy(form.querySelector('button[type=submit]'), 'Logging in…', async () => {
      try {
        const data = await api('/auth/login.php', { method: 'POST', body: { email, password, device: 'web' } })
        saveSession(data.token, data.user)
        // Only go back to pages of this site (never to another website)
        const next = param('next')
        const safe = next && /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(next) && data.user.role === 'reporter'
        location.replace(safe ? next : homeFor(data.user.role))
      } catch (err) {
        showAlert($('#message'), err.message)
      }
    })
  })
}
