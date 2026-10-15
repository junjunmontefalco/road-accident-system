// One report, for every role (the API hides what a role may not see).
// Reporter view: Jan Russel. Staff panels: Vince (admin) and Jan Russel (officer).
import { api } from '../api.js'
import { startPage } from '../app.js'
import { mountMapView } from '../map.js'
import { mountPhotoPicker } from '../photo-picker.js'
import {
  $, busy, clearErrors, esc, formatDate, formatDateTime, formatTime, formData, param, place,
  showAlert, showErrors, statusBadge, STATUS_LABELS, todayISO, toast,
} from '../ui.js'

const user = await startPage({ active: 'x' })
const isStaff = user.role === 'admin' || user.role === 'officer'
const isAdmin = user.role === 'admin'
const root = $('#report')
const back = { reporter: 'my-reports.html', admin: 'admin-reports.html', officer: 'officer.html' }[user.role]
document.querySelector(`.topnav a[href="${back}"], .side-nav a[href="${back}"]`)?.classList.add('active')

let r = null
let options = null
let officers = null

async function load() {
  try {
    r = await api('/reports/view.php', { query: { id: param('id'), code: param('code') } })
    render()
  } catch (e) {
    root.innerHTML = `<a href="${back}" class="small">Back to reports</a><div class="alert alert-danger mt-3">${esc(e.message)}</div>`
  }
}

const REMARK_LABELS = { remark: 'Remark', finding: 'Finding', action: 'Action taken', reporter_info: 'Information from the reporter' }

function render() {
  document.title = `${r.report_code} · RoadReport`
  const vehicles = r.vehicles.map((v) => `${v.quantity} ${v.type}`).join(', ') || 'None listed'
  root.innerHTML = `
    <a href="${back}" class="small">Back to reports</a>
    <div class="d-flex flex-wrap align-items-center gap-3 mt-2 mb-1">
      <h1 class="h3 mb-0">${esc(r.report_code)}</h1>
      ${statusBadge(r.status, r.status_label)}
      <span class="record-kind ${r.is_official_record ? 'is-official' : ''}">
        ${r.is_official_record ? 'Verified accident record' : 'Public report, not yet verified'}</span>
    </div>
    <p class="text-secondary">Submitted ${esc(formatDateTime(r.date_submitted))} from the ${esc(r.source)} app</p>
    ${isStaff ? '<a href="#status-slot" class="btn btn-sm btn-outline-guide d-lg-none mb-3">Update this report</a>' : ''}
    ${r.status === 'rejected' && r.rejection_reason ? `<div class="alert alert-danger">Rejected: ${esc(r.rejection_reason)}</div>` : ''}
    ${isStaff && r.is_flagged ? `<div class="alert alert-warning">Flagged: ${esc(r.flag_reason)}
        ${r.duplicate_of ? ` (<a href="report.html?id=${r.duplicate_of}">see the earlier report</a>)` : ''}</div>` : ''}
    <div id="add-info-slot"></div>

    <div class="row g-4">
      <div class="col-lg-7 stack">
        <section class="panel">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h2 class="h5">Accident details</h2>
            ${isAdmin ? '<button class="btn btn-sm btn-outline-secondary" id="edit-btn">Edit details</button>' : ''}
          </div>
          <dl class="review-list">
            <dt>Date and time</dt><dd>${esc(formatDate(r.accident_date))} at ${esc(formatTime(r.accident_time))}</dd>
            <dt>Type</dt><dd>${esc(r.accident_type)}</dd>
            <dt>Injuries</dt><dd>${esc(r.injury_label)}</dd>
            <dt>Vehicles</dt><dd>${esc(vehicles)}</dd>
            <dt>Location</dt><dd>${esc(place(r))}</dd>
            ${r.latitude != null ? `<dt>GPS</dt><dd>${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}
              <a class="small ms-1" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=18/${r.latitude}/${r.longitude}">open map</a></dd>` : ''}
            <dt>What happened</dt><dd class="pre-wrap">${esc(r.description)}</dd>
            ${isStaff && r.reporter ? `<dt>Reporter</dt><dd>${esc(r.reporter.name)}${r.reporter.contact ? `, <a href="${/^[0-9+]/.test(r.reporter.contact) ? 'tel:' : 'mailto:'}${esc(r.reporter.contact)}">${esc(r.reporter.contact)}</a>` : ''}</dd>` : ''}
            ${r.assigned_officer ? `<dt>Assigned officer</dt><dd>${esc(r.assigned_officer.name)}</dd>` : ''}
            ${isStaff && r.verified_by ? `<dt>Verified by</dt><dd>${esc(r.verified_by)}, ${esc(formatDateTime(r.verified_at))}</dd>` : ''}
          </dl>
        </section>
        ${r.latitude != null ? `<section class="panel"><h2 class="h5">Map</h2><div class="map-box" id="map" style="height:260px"></div></section>` : ''}
        <section class="panel">
          <h2 class="h5">Photos</h2>
          ${r.photos.length
            ? `<div class="photo-grid">${r.photos.map((p, i) => `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="photo-tile" title="Open full size"><img src="${esc(p.url)}" alt="Accident photo ${i + 1}" loading="lazy"></a>`).join('')}</div>`
            : '<p class="text-secondary mb-0">No photos were attached.</p>'}
        </section>
      </div>
      <div class="col-lg-5 stack">
        ${isStaff ? '<div id="status-slot"></div>' : ''}
        ${isAdmin ? '<div id="assign-slot"></div>' : ''}
        ${isStaff ? '<div id="remark-slot"></div>' : ''}
        ${isAdmin ? '<div id="flag-slot"></div>' : ''}
        <section class="panel">
          <h2 class="h5">Status history</h2>
          ${timeline(r.history)}
        </section>
        ${r.remarks.length ? `<section class="panel">
          <h2 class="h5">${isStaff ? 'Remarks and findings' : 'Updates from the traffic office'}</h2>
          <ul class="list-plain mb-0">${r.remarks.map((m) => `
            <li class="py-2 border-bottom">
              <span class="small text-secondary">${esc(REMARK_LABELS[m.type] || m.type)}${isStaff && m.is_internal ? ', internal (reporter cannot see it)' : ''}</span>
              <p class="mb-0 pre-wrap">${esc(m.content)}</p>
              <span class="small text-secondary">${esc(m.officer || '')}, ${esc(formatDateTime(m.date))}</span>
            </li>`).join('')}</ul></section>` : ''}
      </div>
    </div>`

  if (r.latitude != null) mountMapView($('#map'), r.latitude, r.longitude)
  if (user.role === 'reporter' && r.status === 'info_required') addInfoPanel()
  if (isStaff) statusPanel()
  if (isAdmin) {
    assignPanel()
    flagPanel()
    $('#edit-btn').addEventListener('click', openEdit)
  }
  if (isStaff) remarkPanel()
}

function timeline(history) {
  if (!history.length) return '<p class="text-secondary">No status changes yet.</p>'
  return `<ol class="timeline">${history.map((h, i) => `
    <li class="${i === history.length - 1 ? 'is-current' : ''}">
      <div class="d-flex flex-wrap gap-2 align-items-center">${statusBadge(h.status, h.status_label)}
        <time class="small text-secondary">${esc(formatDateTime(h.date))}</time></div>
      ${h.note ? `<p class="mb-0 mt-1">${esc(h.note)}</p>` : ''}
      ${h.changed_by ? `<p class="small text-secondary mb-0">by ${esc(h.changed_by)}</p>` : ''}
    </li>`).join('')}</ol>`
}

/** Run an API action, then redraw with the report it returns. */
async function act(form, label, path, body) {
  clearErrors(form)
  const alertEl = form.querySelector('[data-alert]')
  if (alertEl) showAlert(alertEl, '')
  await busy(form.querySelector('button[type=submit]'), label, async () => {
    try {
      r = await api(path, { method: 'POST', body })
      toast(api.lastMessage || 'Saved')
      render()
    } catch (err) {
      if (Object.keys(err.errors).length) showErrors(form, err.errors)
      if (alertEl) showAlert(alertEl, err.message)
    }
  })
}

// ---------- reporter: answer "Additional Information Required" ----------
function addInfoPanel() {
  const lastNote = [...r.history].reverse().find((h) => h.status === 'info_required')?.note
  const slot = $('#add-info-slot')
  slot.innerHTML = `
    <form class="panel mb-4 border-warning" id="add-info-form" novalidate>
      <h2 class="h5">The traffic office needs more information</h2>
      ${lastNote ? `<p class="mb-2"><strong>They asked:</strong> ${esc(lastNote)}</p>` : ''}
      <div data-alert></div>
      <label class="form-label" for="info-message">Your answer</label>
      <textarea id="info-message" name="message" rows="3" class="form-control mb-3" required></textarea>
      <div id="info-photos"></div>
      <div class="small text-danger" id="info-photo-error"></div>
      <input type="hidden" name="photos">
      <button class="btn btn-guide mt-3" type="submit">Send information</button>
    </form>`
  const form = $('#add-info-form')
  const max = Math.max(0, 5 - r.photos.length)
  const picker = max ? mountPhotoPicker($('#info-photos'), { max, onError: (m) => ($('#info-photo-error').textContent = m) }) : null
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const body = new FormData()
    body.append('id', r.id)
    body.append('message', form.message.value.trim())
    picker?.files().forEach((f) => body.append('photos[]', f, f.name))
    act(form, 'Sending…', '/reports/add-info.php', body)
  })
}

// ---------- staff: status workflow (FR-07, FR-08) ----------
function statusPanel() {
  const opts = (r.allowed_next_statuses || []).filter((s) => s !== 'assigned')
  const slot = $('#status-slot')
  if (!opts.length) {
    slot.innerHTML = `<section class="panel"><h2 class="h5">Update status</h2>
      <p class="text-secondary mb-0">No further status changes for you on this report.</p></section>`
    return
  }
  const choices = opts
  slot.innerHTML = `
    <form class="panel" id="status-form" novalidate>
      <h2 class="h5">Update status</h2>
      ${r.status === 'verified' ? '<p class="small text-secondary">Next step: assign an officer below, or close it as resolved here.</p>' : ''}
      <div data-alert></div>
      <label class="form-label" for="next-status">Change to</label>
      <select id="next-status" name="status" class="form-select mb-2" required>
        <option value="">Choose…</option>
        ${choices.map((s) => `<option value="${s}">${esc(STATUS_LABELS[s])}</option>`).join('')}
      </select>
      <label class="form-label" for="status-note" id="note-label">Note (optional)</label>
      <textarea id="status-note" name="note" rows="2" class="form-control mb-3"></textarea>
      <button class="btn btn-guide" type="submit" disabled>Save status</button>
    </form>`
  const form = $('#status-form')
  const labels = {
    rejected: 'Reason for rejecting (the reporter sees this)',
    info_required: 'What information is missing? (the reporter sees this)',
    verified: 'Verification note (optional)',
    resolved: 'Closing note (optional)',
  }
  form.status.addEventListener('change', () => {
    $('#note-label').textContent = labels[form.status.value] || 'Note (optional)'
    form.querySelector('button[type=submit]').disabled = !form.status.value
  })
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const to = form.status.value
    const note = form.note.value.trim()
    const errors = {}
    if (to === 'rejected' && !note) errors.note = 'Enter the reason'
    if (to === 'info_required' && !note) errors.note = 'Say what is missing'
    if (Object.keys(errors).length) return showErrors(form, errors)
    if (to === 'rejected' && !confirm('Reject this report? This cannot be undone.')) return
    act(form, 'Saving…', '/reports/update-status.php', { id: r.id, status: to, note: note || null, reason: to === 'rejected' ? note : null })
  })
}

// ---------- admin: assign an officer ----------
async function assignPanel() {
  const slot = $('#assign-slot')
  const can = ['verified', 'assigned', 'in_progress'].includes(r.status)
  if (!can) return
  officers ??= (await api('/users/list.php', { query: { role: 'officer', status: 'active' } }).catch(() => ({ items: [] }))).items
  const reassign = r.status !== 'verified'
  slot.innerHTML = `
    <form class="panel" id="assign-form" novalidate>
      <h2 class="h5">${reassign ? 'Change the assigned officer' : 'Assign an officer'}</h2>
      <div data-alert></div>
      <label class="form-label" for="officer">Traffic officer</label>
      <select id="officer" name="officer_id" class="form-select mb-2" required>
        <option value="">Choose…</option>
        ${officers.filter((o) => o.id !== r.assigned_officer?.id).map((o) => `<option value="${o.id}">${esc(o.full_name)} (${esc(o.badge_no || 'no badge')}) - ${o.open_cases} open</option>`).join('')}
      </select>
      <label class="form-label" for="assign-note">Instructions for the officer (optional)</label>
      <textarea id="assign-note" name="note" rows="2" class="form-control mb-3"></textarea>
      <button class="btn btn-guide" type="submit">${reassign ? 'Change officer' : 'Assign'}</button>
    </form>`
  const form = $('#assign-form')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!form.officer_id.value) return showErrors(form, { officer_id: 'Choose an officer' })
    act(form, 'Assigning…', '/reports/assign.php', { id: r.id, officer_id: Number(form.officer_id.value), note: form.note.value.trim() || null })
  })
}

// ---------- staff: remarks, findings, actions taken ----------
function remarkPanel() {
  const slot = $('#remark-slot')
  slot.innerHTML = `
    <form class="panel" id="remark-form" novalidate>
      <h2 class="h5">Add a remark, finding or action</h2>
      <div data-alert></div>
      <div class="choice-row mb-2" role="radiogroup" aria-label="Kind">
        <label class="choice is-picked"><input type="radio" name="type" value="remark" checked> Remark</label>
        <label class="choice"><input type="radio" name="type" value="finding"> Finding</label>
        <label class="choice"><input type="radio" name="type" value="action"> Action taken</label>
      </div>
      <textarea name="content" rows="3" class="form-control mb-2" aria-label="Text" placeholder="Example: Scene inspected; statements taken from both drivers."></textarea>
      <div class="form-check mb-3">
        <input class="form-check-input" type="checkbox" name="is_internal" id="is-internal" checked>
        <label class="form-check-label" for="is-internal">Internal only (the reporter will not see it)</label>
      </div>
      <button class="btn btn-guide" type="submit">Add</button>
    </form>`
  const form = $('#remark-form')
  form.addEventListener('change', () =>
    form.querySelectorAll('.choice').forEach((l) => l.classList.toggle('is-picked', l.querySelector('input').checked)),
  )
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = formData(form)
    if (f.content.length < 3) return showErrors(form, { content: 'Write the remark' })
    act(form, 'Adding…', '/reports/add-remark.php', { id: r.id, type: f.type, content: f.content, is_internal: f.is_internal })
  })
}

// ---------- admin: flag incomplete or duplicate ----------
function flagPanel() {
  const slot = $('#flag-slot')
  slot.innerHTML = r.is_flagged
    ? `<form class="panel" id="flag-form"><h2 class="h5">Flag</h2><div data-alert></div>
        <p class="mb-2">This report is flagged: ${esc(r.flag_reason)}</p>
        <button class="btn btn-outline-secondary" type="submit">Remove flag</button></form>`
    : `<form class="panel" id="flag-form" novalidate><h2 class="h5">Flag as incomplete or duplicate</h2><div data-alert></div>
        <label class="form-label" for="flag-reason">Reason</label>
        <input id="flag-reason" name="reason" class="form-control mb-2" list="flag-reasons" placeholder="Incomplete details">
        <datalist id="flag-reasons"><option value="Incomplete details"><option value="Duplicate of another report"><option value="Location cannot be confirmed"></datalist>
        <label class="form-label" for="flag-dup">Duplicate of (report ID, optional)</label>
        <input id="flag-dup" name="duplicate_of" class="form-control mb-3" placeholder="RA-2026-000012">
        <button class="btn btn-outline-danger" type="submit">Flag report</button></form>`
  const form = $('#flag-form')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const body = r.is_flagged
      ? { id: r.id, flagged: false }
      : { id: r.id, flagged: true, reason: form.reason.value.trim() || null, duplicate_of: form.duplicate_of.value.trim() || null }
    act(form, 'Saving…', '/reports/flag.php', body)
  })
}

// ---------- admin: edit report details (modal) ----------
async function openEdit() {
  options ??= await api('/accident-types/list.php', { query: { all: 1 } })
  const modalEl = $('#edit-modal')
  const form = $('#edit-form')
  form.innerHTML = `
    <div data-alert></div>
    <div class="row g-3">
      <div class="col-sm-6"><label class="form-label" for="e-date">Accident date</label>
        <input id="e-date" type="date" name="accident_date" class="form-control" max="${todayISO()}" value="${esc(r.accident_date)}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-time">Time</label>
        <input id="e-time" type="time" name="accident_time" class="form-control" value="${esc(r.accident_time)}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-type">Type</label>
        <select id="e-type" name="accident_type_id" class="form-select">${options.accident_types.filter((t) => t.is_active || t.id === r.accident_type_id)
          .map((t) => `<option value="${t.id}" ${t.id === r.accident_type_id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
      <div class="col-sm-6"><label class="form-label" for="e-injury">Injuries</label>
        <select id="e-injury" name="injury_status" class="form-select">${options.injury_options
          .map((o) => `<option value="${o.value}" ${o.value === r.injury_status ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>
      <div class="col-12"><label class="form-label" for="e-loc">Road, street or landmark</label>
        <input id="e-loc" name="location_text" class="form-control" value="${esc(r.location_text)}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-brgy">Barangay</label>
        <input id="e-brgy" name="barangay" class="form-control" value="${esc(r.barangay || '')}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-mun">Municipality</label>
        <input id="e-mun" name="municipality" class="form-control" value="${esc(r.municipality || '')}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-lat">Latitude</label>
        <input id="e-lat" name="latitude" class="form-control" inputmode="decimal" value="${r.latitude ?? ''}"></div>
      <div class="col-sm-6"><label class="form-label" for="e-lng">Longitude</label>
        <input id="e-lng" name="longitude" class="form-control" inputmode="decimal" value="${r.longitude ?? ''}"></div>
      <div class="col-12"><label class="form-label" for="e-veh">Vehicles (one per line, e.g. "2 Car")</label>
        <textarea id="e-veh" name="vehicles" rows="2" class="form-control">${esc(r.vehicles.map((v) => `${v.quantity} ${v.type}`).join('\n'))}</textarea></div>
      <div class="col-12"><label class="form-label" for="e-desc">What happened</label>
        <textarea id="e-desc" name="description" rows="4" class="form-control">${esc(r.description)}</textarea></div>
    </div>
    <p class="small text-secondary mt-2 mb-0">The old and new values are saved in the audit trail.</p>`
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl)
  modal.show()
  $('#edit-save').onclick = async () => {
    const f = formData(form)
    f.vehicles = f.vehicles
      .split('\n')
      .map((line) => line.trim().match(/^(\d+)\s+(.+)$/) || (line.trim() ? [null, '1', line.trim()] : null))
      .filter(Boolean)
      .map(([, q, t]) => ({ type: t, quantity: Number(q) }))
    f.id = r.id
    clearErrors(form)
    await busy($('#edit-save'), 'Saving…', async () => {
      try {
        r = await api('/reports/edit.php', { method: 'POST', body: f })
        modal.hide()
        toast(api.lastMessage || 'Saved')
        render()
      } catch (err) {
        showErrors(form, err.errors)
        showAlert(form.querySelector('[data-alert]'), err.message)
      }
    })
  }
}

load()
