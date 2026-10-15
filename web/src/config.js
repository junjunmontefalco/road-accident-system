// Change the system name here once the group decides on one.
export const APP_NAME = 'RoadReport'

// Where the PHP API lives. Override it in web/.env (see .env.example).
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/road-accident-system/api'

// Default map center: Malolos, Bulacan
export const MAP_CENTER = [14.8433, 120.8114]

export const MAX_PHOTOS = 5
export const MAX_PHOTO_MB = 5

// Bulacan cities and municipalities (for the location field suggestions)
export const BULACAN_TOWNS = [
  'Angat', 'Balagtas', 'Baliwag', 'Bocaue', 'Bulakan', 'Bustos', 'Calumpit', 'Doña Remedios Trinidad',
  'Guiguinto', 'Hagonoy', 'Malolos', 'Marilao', 'Meycauayan', 'Norzagaray', 'Obando', 'Pandi', 'Paombong',
  'Plaridel', 'Pulilan', 'San Ildefonso', 'San Jose del Monte', 'San Miguel', 'San Rafael', 'Santa Maria',
]
