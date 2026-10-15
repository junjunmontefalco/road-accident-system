import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { OSM_ATTRIBUTION, OSM_TILES } from './leafletSetup'
import { MAP_CENTER } from '../config'

function ClickToPin({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function FlyTo({ point }) {
  const map = useMap()
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [point, map])
  return null
}

/**
 * FR-04 location capture: GPS button or tap the map to drop a pin.
 * value = { lat, lng } or null
 */
export default function MapPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const useGps = () => {
    if (!navigator.geolocation) {
      setGpsError('This browser cannot read your location. Tap the map instead.')
      return
    }
    setLocating(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setLocating(false)
        setGpsError(
          err.code === 1
            ? 'Location permission was denied. Allow it in the browser, or tap the map to place the pin.'
            : 'Could not get your location. Tap the map to place the pin.',
        )
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="map-picker">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
        <button type="button" className="btn btn-outline-guide btn-sm" onClick={useGps} disabled={locating}>
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        {value ? (
          <>
            <span className="small text-secondary">
              Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onChange(null)}>
              Remove pin
            </button>
          </>
        ) : (
          <span className="small text-secondary">or tap the map where the accident happened</span>
        )}
      </div>
      {gpsError && <div className="small text-danger mb-2">{gpsError}</div>}
      <MapContainer center={value ? [value.lat, value.lng] : MAP_CENTER} zoom={13} className="map-box">
        <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
        <ClickToPin onPick={onChange} />
        <FlyTo point={value} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  )
}
