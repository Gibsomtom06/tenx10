export interface CityCoord {
  city: string
  state: string
  lat: number
  lng: number
}

// Major US music markets with coordinates
const CITY_COORDS: CityCoord[] = [
  // Primary
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.006 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  // Secondary
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Portland', state: 'OR', lat: 45.5051, lng: -122.675 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.797 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
  { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { city: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.512 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
  { city: 'St. Louis', state: 'MO', lat: 38.627, lng: -90.1994 },
  { city: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { city: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.891 },
  { city: 'Albuquerque', state: 'NM', lat: 35.0844, lng: -106.6504 },
  { city: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382 },
  { city: 'Richmond', state: 'VA', lat: 37.5407, lng: -77.436 },
  { city: 'Norfolk', state: 'VA', lat: 36.8508, lng: -76.2859 },
  { city: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  { city: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0489 },
  { city: 'Knoxville', state: 'TN', lat: 35.9606, lng: -83.9207 },
  { city: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585 },
  { city: 'Lexington', state: 'KY', lat: 38.0406, lng: -84.5037 },
  { city: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784 },
  { city: 'Albany', state: 'NY', lat: 42.6526, lng: -73.7562 },
  { city: 'Hartford', state: 'CT', lat: 41.7658, lng: -72.6851 },
  { city: 'Providence', state: 'RI', lat: 41.824, lng: -71.4128 },
  { city: 'Asbury Park', state: 'NJ', lat: 40.2204, lng: -74.012 },
  { city: 'Newark', state: 'NJ', lat: 40.7357, lng: -74.1724 },
  { city: 'Omaha', state: 'NE', lat: 41.2565, lng: -95.9345 },
  { city: 'Des Moines', state: 'IA', lat: 41.5868, lng: -93.625 },
  { city: 'Madison', state: 'WI', lat: 43.0731, lng: -89.4012 },
  { city: 'Green Bay', state: 'WI', lat: 44.5133, lng: -88.0133 },
  { city: 'Grand Rapids', state: 'MI', lat: 42.9634, lng: -85.6681 },
  { city: 'Ann Arbor', state: 'MI', lat: 42.2808, lng: -83.743 },
  { city: 'Lansing', state: 'MI', lat: 42.7325, lng: -84.5555 },
  { city: 'Flint', state: 'MI', lat: 43.0125, lng: -83.6875 },
  { city: 'Spokane', state: 'WA', lat: 47.6588, lng: -117.426 },
  { city: 'Tacoma', state: 'WA', lat: 47.2529, lng: -122.4443 },
  { city: 'Boise', state: 'ID', lat: 43.615, lng: -116.2023 },
  { city: 'Missoula', state: 'MT', lat: 46.8721, lng: -113.994 },
  { city: 'Butte', state: 'MT', lat: 46.0038, lng: -112.5348 },
  { city: 'Billings', state: 'MT', lat: 45.7833, lng: -108.5007 },
  { city: 'Cheyenne', state: 'WY', lat: 41.14, lng: -104.8202 },
  { city: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214 },
  { city: 'Boulder', state: 'CO', lat: 40.015, lng: -105.2705 },
  { city: 'Fort Collins', state: 'CO', lat: 40.5853, lng: -105.0844 },
  { city: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.9928 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
  { city: 'Lubbock', state: 'TX', lat: 33.5779, lng: -101.8552 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'El Paso', state: 'TX', lat: 31.7619, lng: -106.485 },
  { city: 'Corpus Christi', state: 'TX', lat: 27.8006, lng: -97.3964 },
  { city: 'Birmingham', state: 'AL', lat: 33.5186, lng: -86.8104 },
  { city: 'Huntsville', state: 'AL', lat: 34.7304, lng: -86.5861 },
  { city: 'Columbia', state: 'SC', lat: 34.0007, lng: -81.0348 },
  { city: 'Charleston', state: 'SC', lat: 32.7765, lng: -79.9311 },
  { city: 'Savannah', state: 'GA', lat: 32.0835, lng: -81.0998 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lng: -80.1373 },
  { city: 'Gainesville', state: 'FL', lat: 29.6516, lng: -82.3248 },
  { city: 'Tallahassee', state: 'FL', lat: 30.4383, lng: -84.2807 },
  { city: 'Daytona Beach', state: 'FL', lat: 29.2108, lng: -81.0228 },
  { city: 'Allentown', state: 'PA', lat: 40.6023, lng: -75.4714 },
  { city: 'Scranton', state: 'PA', lat: 41.409, lng: -75.6624 },
  { city: 'Syracuse', state: 'NY', lat: 43.0481, lng: -76.1474 },
  { city: 'Rochester', state: 'NY', lat: 43.1566, lng: -77.6088 },
  { city: 'Worcester', state: 'MA', lat: 42.2626, lng: -71.8023 },
  { city: 'Burlington', state: 'VT', lat: 44.4759, lng: -73.2121 },
  { city: 'Portsmouth', state: 'NH', lat: 43.0718, lng: -70.7626 },
  { city: 'Portland', state: 'ME', lat: 43.6591, lng: -70.2568 },
  { city: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003 },
  { city: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
]

const LOOKUP = new Map(
  CITY_COORDS.flatMap(c => [
    [`${c.city.toLowerCase()}|${c.state.toLowerCase()}`, c],
    [`${c.city.toLowerCase()}|`, c],
  ])
)

export function getCityCoords(city: string, state?: string | null): CityCoord | null {
  const cityKey = city.trim().toLowerCase()
  const stateKey = (state ?? '').trim().toLowerCase()
  return LOOKUP.get(`${cityKey}|${stateKey}`) ?? LOOKUP.get(`${cityKey}|`) ?? null
}

export { CITY_COORDS }
