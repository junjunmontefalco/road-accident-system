import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import MapPicker from '../../components/MapPicker'
import PhotoPicker from '../../components/PhotoPicker'
import { BULACAN_TOWNS } from '../../config'
import { nowHHMM, todayISO } from '../../utils/format'

/**
 * FR-03, FR-04, FR-05: submit an accident report in three steps.
 * Owner: Jan Russel. Field names match api/reports/create.php.
 */
const STEPS = ['Details', 'Location', 'Photos and send']
const STEP_OF_FIELD = {
  accident_date: 0, accident_time: 0, accident_type_id: 0, injury_status: 0, description: 0, vehicles: 0,
  location_text: 1, barangay: 1, municipality: 1, latitude: 1,
  photos: 2,
}

export default function ReportForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [options, setOptions] = useState({ accident_types: [], injury_options: [], vehicle_types: [] })
  const [f, setF] = useState({
    accident_date: todayISO(),
    accident_time: nowHHMM(),
    accident_type_id: '',
    injury_status: '',
    description: '',
    location_text: '',
    barangay: '',
    municipality: '',
  })
  const [vehicles, setVehicles] = useState([{ type: 'Car', quantity: 1 }])
  const [point, setPoint] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/accident-types/list.php').then(setOptions).catch((e) => setMessage(e.message))
  }, [])

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
    if (errors[k]) setErrors(({ [k]: _fixed, ...rest }) => rest) // clear the message once the field changes
  }
  const typeName = options.accident_types.find((t) => String(t.id) === String(f.accident_type_id))?.name

  // Quick checks before moving on; the server checks everything again
  const checkStep = (s) => {
    const e = {}
    if (s === 0) {
      if (!f.accident_date) e.accident_date = 'Enter the date of the accident'
      else if (f.accident_date > todayISO()) e.accident_date = 'The date cannot be in the future'
      if (!f.accident_time) e.accident_time = 'Enter the time'
      if (!f.accident_type_id) e.accident_type_id = 'Choose the accident type'
      if (!f.injury_status) e.injury_status = 'Choose an injury option'
      if (f.description.trim().length < 10) e.description = 'Describe what happened (at least 10 characters)'
    }
    if (s === 1 && f.location_text.trim().length < 3) e.location_text = 'Enter the road, street or landmark'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => checkStep(step) && setStep(step + 1)

  const submit = async () => {
    if (!checkStep(0)) return setStep(0)
    if (!checkStep(1)) return setStep(1)
    setBusy(true)
    setMessage('')
    const body = new FormData()
    Object.entries(f).forEach(([k, v]) => body.append(k, v))
    if (point) {
      body.append('latitude', point.lat.toFixed(7))
      body.append('longitude', point.lng.toFixed(7))
    }
    body.append('vehicles', JSON.stringify(vehicles.filter((v) => v.type && v.quantity > 0)))
    body.append('source', 'web')
    photos.forEach((p) => body.append('photos[]', p))
    try {
      const report = await api('/reports/create.php', { method: 'POST', body })
      navigate(`/report/submitted/${report.id}`, { replace: true, state: { report } })
    } catch (err) {
      setErrors(err.errors || {})
      setMessage(err.message)
      const first = Object.keys(err.errors || {})[0]
      if (first in STEP_OF_FIELD) setStep(STEP_OF_FIELD[first])
    } finally {
      setBusy(false)
    }
  }

  const invalid = (k) => (errors[k] ? 'is-invalid' : '')
  const feedback = (k) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>

  return (
    <div className="form-page">
      <h1 className="h3 mb-3">Report an accident</h1>

      <ol className="stepper" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-active' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="stepper-num">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {message && <div className="alert alert-danger py-2">{message}</div>}

      <div className="panel">
        {step === 0 && (
          <>
            <div className="row g-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="accident_date">Date of the accident</label>
                <input id="accident_date" type="date" max={todayISO()} className={`form-control ${invalid('accident_date')}`}
                  value={f.accident_date} onChange={set('accident_date')} />
                {feedback('accident_date')}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="accident_time">Time (approximate is fine)</label>
                <input id="accident_time" type="time" className={`form-control ${invalid('accident_time')}`}
                  value={f.accident_time} onChange={set('accident_time')} />
                {feedback('accident_time')}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="accident_type_id">Type of accident</label>
                <select id="accident_type_id" className={`form-select ${invalid('accident_type_id')}`}
                  value={f.accident_type_id} onChange={set('accident_type_id')}>
                  <option value="">Choose…</option>
                  {options.accident_types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {feedback('accident_type_id')}
              </div>
              <div className="col-sm-6">
                <span className="form-label d-block">Injuries or fatalities</span>
                <div className="choice-row" role="radiogroup" aria-label="Injuries or fatalities">
                  {options.injury_options.map((o) => (
                    <label key={o.value} className={`choice ${f.injury_status === o.value ? 'is-picked' : ''}`}>
                      <input type="radio" name="injury_status" value={o.value} checked={f.injury_status === o.value}
                        onChange={set('injury_status')} />
                      {o.label}
                    </label>
                  ))}
                </div>
                {feedback('injury_status')}
              </div>
            </div>

            <fieldset className="mt-4">
              <legend className="form-label fs-6">Vehicles involved</legend>
              {vehicles.map((v, i) => (
                <div key={i} className="d-flex gap-2 mb-2">
                  <select className="form-select" aria-label="Vehicle type" value={v.type}
                    onChange={(e) => setVehicles(vehicles.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>
                    {options.vehicle_types.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input type="number" min="1" max="20" className="form-control qty-input" aria-label="How many"
                    value={v.quantity}
                    onChange={(e) => setVehicles(vehicles.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
                  <button type="button" className="btn btn-outline-secondary" aria-label="Remove vehicle"
                    onClick={() => setVehicles(vehicles.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-link btn-sm px-0"
                onClick={() => setVehicles([...vehicles, { type: 'Motorcycle', quantity: 1 }])}>
                Add another vehicle
              </button>
            </fieldset>

            <div className="mt-3">
              <label className="form-label" htmlFor="description">What happened?</label>
              <textarea id="description" rows="4" className={`form-control ${invalid('description')}`}
                placeholder="Example: A tricycle was hit from behind while turning into the market road."
                value={f.description} onChange={set('description')} />
              {feedback('description')}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <MapPicker value={point} onChange={setPoint} />
            {feedback('latitude')}
            <div className="row g-3 mt-1">
              <div className="col-12">
                <label className="form-label" htmlFor="location_text">Road, street or landmark</label>
                <input id="location_text" className={`form-control ${invalid('location_text')}`}
                  placeholder="Example: MacArthur Highway in front of the public market"
                  value={f.location_text} onChange={set('location_text')} />
                {feedback('location_text')}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="barangay">Barangay</label>
                <input id="barangay" className="form-control" value={f.barangay} onChange={set('barangay')} />
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="municipality">City or municipality</label>
                <input id="municipality" className="form-control" list="towns" value={f.municipality} onChange={set('municipality')} />
                <datalist id="towns">{BULACAN_TOWNS.map((t) => <option key={t} value={t} />)}</datalist>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <PhotoPicker value={photos} onChange={setPhotos} error={photoError || errors.photos} setError={setPhotoError} />
            <h2 className="h6 mt-4">Check before sending</h2>
            <dl className="review-list">
              <dt>When</dt><dd>{f.accident_date}, {f.accident_time}</dd>
              <dt>Type</dt><dd>{typeName}</dd>
              <dt>Where</dt>
              <dd>
                {[f.location_text, f.barangay, f.municipality].filter(Boolean).join(', ')}
                {point ? ' (pinned on map)' : ' (no map pin)'}
              </dd>
              <dt>Vehicles</dt><dd>{vehicles.map((v) => `${v.quantity} ${v.type}`).join(', ') || 'None listed'}</dd>
            </dl>
          </>
        )}
      </div>

      <div className="d-flex justify-content-between mt-3">
        <button type="button" className="btn btn-outline-secondary" disabled={step === 0 || busy}
          onClick={() => setStep(step - 1)}>
          Back
        </button>
        {step < 2 ? (
          <button type="button" className="btn btn-guide" onClick={next}>Next: {STEPS[step + 1]}</button>
        ) : (
          <button type="button" className="btn btn-report" onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Send report'}
          </button>
        )}
      </div>
    </div>
  )
}
