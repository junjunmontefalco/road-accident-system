// FR-03, FR-04, FR-05: submit an accident report in three steps.
// Owner: Jan Russel. Field names match api/reports/create.php.
import { api } from '../api.js'
import { startPage } from '../app.js'
import { BULACAN_TOWNS } from '../config.js'
import { mountMapPicker } from '../map.js'
import { mountPhotoPicker } from '../photo-picker.js'
import { $, $$, busy, clearErrors, esc, nowHHMM, showAlert, showErrors, todayISO } from '../ui.js'

await startPage({ roles: ['reporter'], active: 'home.html' })

const STEPS = ['Details', 'Location', 'Photos and send']
const STEP_OF_FIELD = {
  accident_date: 0, accident_time: 0, accident_type_id: 0, injury_status: 0, description: 0, vehicles: 0,
  location_text: 1, barangay: 1, municipality: 1, latitude: 1,
  photos: 2,
}
const form = $('#report-form')
const message = $('#message')
let step = 0
let point = null
let vehicles = [{ type: 'Car', quantity: 1 }]
let options = { accident_types: [], injury_options: [], vehicle_types: [], max_photos: 5 }

form.accident_date.value = todayISO()
form.accident_date.max = todayISO()
form.accident_time.value = nowHHMM()
$('#towns').innerHTML = BULACAN_TOWNS.map((t) => `<option value="${esc(t)}">`).join('')

// ---------- options from the API ----------
try {
  options = await api('/accident-types/list.php')
} catch (e) {
  showAlert(message, e.message)
}
form.accident_type_id.insertAdjacentHTML('beforeend', options.accident_types.map((t) => `<option value="${t.id}" title="${esc(t.description || '')}">${esc(t.name)}</option>`).join(''))
$('#injury').innerHTML = options.injury_options
  .map((o) => `<label class="choice"><input type="radio" name="injury_status" value="${o.value}"> ${esc(o.label)}</label>`)
  .join('')
$('#injury').addEventListener('change', () =>
  $$('.choice', $('#injury')).forEach((l) => l.classList.toggle('is-picked', l.querySelector('input').checked)),
)

// ---------- vehicles ----------
function renderVehicles() {
  $('#vehicle-rows').innerHTML = vehicles
    .map(
      (v, i) => `<div class="d-flex gap-2 mb-2">
        <select class="form-select" aria-label="Vehicle type" data-vtype="${i}">
          ${options.vehicle_types.map((t) => `<option ${t === v.type ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select>
        <input type="number" min="1" max="20" class="form-control qty-input" aria-label="How many" value="${v.quantity}" data-vqty="${i}">
        <button type="button" class="btn btn-outline-secondary" aria-label="Remove vehicle" data-vdel="${i}">×</button>
      </div>`,
    )
    .join('')
  $$('[data-vtype]').forEach((el) => el.addEventListener('change', () => (vehicles[el.dataset.vtype].type = el.value)))
  $$('[data-vqty]').forEach((el) => el.addEventListener('input', () => (vehicles[el.dataset.vqty].quantity = Number(el.value))))
  $$('[data-vdel]').forEach((el) =>
    el.addEventListener('click', () => {
      vehicles.splice(Number(el.dataset.vdel), 1)
      renderVehicles()
    }),
  )
}
$('#add-vehicle').addEventListener('click', () => {
  vehicles.push({ type: 'Motorcycle', quantity: 1 })
  renderVehicles()
})
renderVehicles()

// ---------- map and photos ----------
// The map is built the first time step 2 is shown (Leaflet needs a visible box to measure)
let picker = null
const photos = mountPhotoPicker($('#photo-picker'), {
  max: options.max_photos || 5,
  onError: (msg) => ($('#photo-error').textContent = msg),
})

// ---------- steps ----------
function showStep(n) {
  step = n
  $$('[data-step]').forEach((s) => (s.hidden = Number(s.dataset.step) !== n))
  $('#stepper').innerHTML = STEPS.map(
    (label, i) => `<li class="${i === n ? 'is-active' : i < n ? 'is-done' : ''}" ${i === n ? 'aria-current="step"' : ''}><span class="stepper-num">${i + 1}</span>${label}</li>`,
  ).join('')
  $('#back').disabled = n === 0
  $('#next').hidden = n === STEPS.length - 1
  $('#next').textContent = n < STEPS.length - 1 ? `Next: ${STEPS[n + 1]}` : ''
  $('#send').hidden = n !== STEPS.length - 1
  if (n === 1) {
    if (picker) picker.refresh()
    else picker = mountMapPicker($('#map-picker'), { value: point, onChange: (p) => (point = p) })
  }
  if (n === 2) renderReview()
  window.scrollTo({ top: 0 })
}

// Quick checks before moving on; the server checks everything again
function checkStep(s) {
  const e = {}
  const f = form
  if (s === 0) {
    if (!f.accident_date.value) e.accident_date = 'Enter the date of the accident'
    else if (f.accident_date.value > todayISO()) e.accident_date = 'The date cannot be in the future'
    if (!f.accident_time.value) e.accident_time = 'Enter the time'
    if (!f.accident_type_id.value) e.accident_type_id = 'Choose the accident type'
    if (!form.querySelector('[name=injury_status]:checked')) e.injury_status = 'Choose an injury option (pick Unknown if not sure)'
    if (f.description.value.trim().length < 10) e.description = 'Describe what happened (at least 10 characters)'
  }
  if (s === 1 && f.location_text.value.trim().length < 3) e.location_text = 'Enter the road, street or landmark'
  if (Object.keys(e).length) showErrors(form, e)
  else clearErrors(form)
  return Object.keys(e).length === 0
}

function renderReview() {
  const f = form
  const type = options.accident_types.find((t) => String(t.id) === f.accident_type_id.value)
  const injury = options.injury_options.find((o) => o.value === form.querySelector('[name=injury_status]:checked')?.value)
  $('#review').innerHTML = `
    <dt>When</dt><dd>${esc(f.accident_date.value)}, ${esc(f.accident_time.value)}</dd>
    <dt>Type</dt><dd>${esc(type?.name || '')}</dd>
    <dt>Injuries</dt><dd>${esc(injury?.label || '')}</dd>
    <dt>Where</dt><dd>${esc([f.location_text.value, f.barangay.value, f.municipality.value].filter((x) => x.trim()).join(', '))} ${point ? '(pinned on map)' : '(no map pin)'}</dd>
    <dt>Vehicles</dt><dd>${esc(vehicles.filter((v) => v.quantity > 0).map((v) => `${v.quantity} ${v.type}`).join(', ') || 'None listed')}</dd>`
}

$('#next').addEventListener('click', () => checkStep(step) && showStep(step + 1))
$('#back').addEventListener('click', () => showStep(step - 1))
form.addEventListener('input', (e) => {
  e.target.classList.remove('is-invalid')
  form.querySelector(`[data-error="${e.target.name}"]`)?.remove()
})
form.addEventListener('submit', (e) => e.preventDefault())

$('#send').addEventListener('click', async () => {
  if (!checkStep(0)) return showStep(0)
  if (!checkStep(1)) return showStep(1)
  showAlert(message, '')
  const body = new FormData()
  for (const name of ['accident_date', 'accident_time', 'accident_type_id', 'description', 'location_text', 'barangay', 'municipality']) {
    body.append(name, form[name].value.trim())
  }
  body.append('injury_status', form.querySelector('[name=injury_status]:checked').value)
  if (point) {
    body.append('latitude', point.lat.toFixed(7))
    body.append('longitude', point.lng.toFixed(7))
  }
  body.append('vehicles', JSON.stringify(vehicles.filter((v) => v.type && v.quantity > 0)))
  body.append('source', 'web')
  photos.files().forEach((p) => body.append('photos[]', p, p.name))

  await busy($('#send'), 'Sending…', async () => {
    try {
      const report = await api('/reports/create.php', { method: 'POST', body })
      location.replace(`report-submitted.html?id=${report.id}`)
    } catch (err) {
      showAlert(message, err.message)
      const first = Object.keys(err.errors)[0]
      if (first in STEP_OF_FIELD) showStep(STEP_OF_FIELD[first])
      showErrors(form, err.errors)
    }
  })
})

showStep(0)
