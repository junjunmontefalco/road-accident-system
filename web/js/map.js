// Maps with Leaflet + OpenStreetMap (free, no API key). Leaflet is loaded by a <script> tag as `L`.
import { MAP_CENTER } from './config.js'
import { esc, formatDate, statusBadge } from './ui.js'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function baseMap(el, center, zoom, options = {}) {
  const map = L.map(el, options).setView(center, zoom)
  L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
  return map
}

/**
 * FR-04 location capture: GPS button or tap the map to drop a pin.
 * Calls onChange({ lat, lng }) or onChange(null).
 */
export function mountMapPicker(container, { value = null, onChange }) {
  container.innerHTML = `
    <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
      <button type="button" class="btn btn-outline-guide btn-sm" data-gps>Use my current location</button>
      <span class="small text-secondary" data-status></span>
      <button type="button" class="btn btn-link btn-sm p-0 d-none" data-clear>Remove pin</button>
    </div>
    <div class="small text-danger mb-2" data-error></div>
    <div class="map-box" data-map></div>`
  const status = container.querySelector('[data-status]')
  const clear = container.querySelector('[data-clear]')
  const error = container.querySelector('[data-error]')
  const gps = container.querySelector('[data-gps]')
  const map = baseMap(container.querySelector('[data-map]'), value ? [value.lat, value.lng] : MAP_CENTER, value ? 16 : 13)
  let marker = null

  const set = (point, fly = false) => {
    if (marker) marker.remove()
    marker = point ? L.marker([point.lat, point.lng], { draggable: true }).addTo(map) : null
    marker?.on('dragend', () => {
      const p = marker.getLatLng()
      set({ lat: p.lat, lng: p.lng })
    })
    if (point && fly) {
      map.invalidateSize()
      if (map.getSize().x > 0) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 16), { duration: 0.6 })
      else map.setView([point.lat, point.lng], 16)
    }
    status.textContent = point ? `Pinned at ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'or tap the map where the accident happened'
    clear.classList.toggle('d-none', !point)
    onChange(point)
  }

  map.on('click', (e) => set({ lat: e.latlng.lat, lng: e.latlng.lng }))
  clear.addEventListener('click', () => set(null))
  gps.addEventListener('click', () => {
    if (!navigator.geolocation) {
      error.textContent = 'This browser cannot read your location. Tap the map instead.'
      return
    }
    gps.disabled = true
    gps.textContent = 'Finding your location…'
    error.textContent = ''
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gps.disabled = false
        gps.textContent = 'Use my current location'
        set({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true)
      },
      (err) => {
        gps.disabled = false
        gps.textContent = 'Use my current location'
        error.textContent =
          err.code === 1
            ? 'Location permission was denied. Allow it in the browser, or tap the map to place the pin.'
            : 'Could not get your location (the site must use https or localhost). Tap the map to place the pin.'
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
  set(value)
  // The map may be inside a hidden step; fix its size once it becomes visible
  return { map, refresh: () => setTimeout(() => map.invalidateSize(), 50) }
}

/** Read-only map with one pin (report details). */
export function mountMapView(el, lat, lng) {
  const map = baseMap(el, [lat, lng], 16, { scrollWheelZoom: false })
  L.marker([lat, lng]).addTo(map)
  return map
}

const STATUS_COLORS = {
  submitted: '#6c757d', under_review: '#1f4f8a', info_required: '#b38600', verified: '#0b5039',
  assigned: '#43378c', in_progress: '#c4610f', resolved: '#0f6b4c', rejected: '#c8322b',
}

/** Dashboard map: one colored dot per report. */
export function mountPointsMap(el, points) {
  const map = baseMap(el, MAP_CENTER, 10)
  const layer = L.featureGroup().addTo(map)
  for (const p of points) {
    L.circleMarker([p.latitude, p.longitude], {
      radius: p.is_official_record ? 8 : 6,
      color: '#23272b',
      weight: 1,
      fillColor: STATUS_COLORS[p.status] || '#6c757d',
      fillOpacity: 0.85,
    })
      .bindPopup(
        `<strong><a href="report.html?id=${p.id}">${esc(p.report_code)}</a></strong><br>${esc(p.accident_type)}, ${esc(formatDate(p.accident_date))}<br>${esc(p.location_text)}<br>${statusBadge(p.status, p.status_label)}`,
      )
      .addTo(layer)
  }
  if (points.length) map.fitBounds(layer.getBounds().pad(0.15))
  return map
}

export { STATUS_COLORS }
