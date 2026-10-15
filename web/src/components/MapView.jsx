import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { OSM_ATTRIBUTION, OSM_TILES } from './leafletSetup'

/** Read-only map with one pin (report details). */
export default function MapView({ lat, lng, height = 260 }) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} className="map-box" style={{ height }} scrollWheelZoom={false}>
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
      <Marker position={[lat, lng]} />
    </MapContainer>
  )
}
