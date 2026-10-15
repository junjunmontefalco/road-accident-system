// FR-01 registration (creates a reporter account). Owner: Jan Russel
import { api, saveSession } from '../api.js'
import { redirectIfLoggedIn } from '../app.js'
import { $, busy, clearErrors, formData, showAlert, showErrors } from '../ui.js'

if (!redirectIfLoggedIn()) {
  const form = $('#register-form')
  form.addEventListener('input', (e) => {
    e.target.classList.remove('is-invalid')
    form.querySelector(`[data-error="${e.target.name}"]`)?.remove()
  })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    clearErrors(form)
    showAlert($('#message'), '')
    const body = formData(form)
    body.phone = body.phone || null
    body.device = 'web'
    await busy(form.querySelector('button[type=submit]'), 'Creating account…', async () => {
      try {
        const data = await api('/auth/register.php', { method: 'POST', body })
        saveSession(data.token, data.user)
        location.replace('home.html')
      } catch (err) {
        if (Object.keys(err.errors).length) showErrors(form, err.errors)
        else showAlert($('#message'), err.message)
      }
    })
  })
}
