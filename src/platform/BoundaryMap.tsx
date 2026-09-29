import { useState } from 'react'

type Point = [number, number]
const tileSize = 256
function project(lon: number, lat: number, zoom: number): Point {
  const scale = tileSize * 2 ** zoom
  const safeLat = Math.max(-85, Math.min(85, lat)) * Math.PI / 180
  return [(lon + 180) / 360 * scale, (1 - Math.log(Math.tan(safeLat) + 1 / Math.cos(safeLat)) / Math.PI) / 2 * scale]
}
function unproject(x: number, y: number, zoom: number): Point {
  const scale = tileSize * 2 ** zoom
  return [x / scale * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI]
}
export function parseBoundary(value: string): Point[] {
  try {
    const geo = JSON.parse(value)
    const points = geo?.type === 'Polygon' ? geo.coordinates?.[0] : null
    if (!Array.isArray(points)) return []
    const valid: Point[] = points.filter((p: unknown) => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v)))
    return valid.length > 1 && JSON.stringify(valid[0]) === JSON.stringify(valid.at(-1)) ? valid.slice(0, -1) : valid
  } catch { return [] }
}
export function BoundaryMap({ value, onChange, readOnly = false }: { value: string; onChange?: (value: string) => void; readOnly?: boolean }) {
  const points = parseBoundary(value)
  const [lat, setLat] = useState(points[0]?.[1] ?? -17.8252)
  const [lon, setLon] = useState(points[0]?.[0] ?? 31.0335)
  const [zoom, setZoom] = useState(15)
  const [tileError, setTileError] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [place, setPlace] = useState('')
  const [findingPlace, setFindingPlace] = useState(false)
  const width = 640, height = 350
  const [cx, cy] = project(lon, lat, zoom)
  const left = cx - width / 2, top = cy - height / 2
  const tiles = []
  for (let x = Math.floor(left / tileSize); x <= Math.floor((left + width) / tileSize); x++) {
    for (let y = Math.floor(top / tileSize); y <= Math.floor((top + height) / tileSize); y++) {
      if (x >= 0 && y >= 0 && x < 2 ** zoom && y < 2 ** zoom) tiles.push({ x, y })
    }
  }
  const update = (next: Point[]) => onChange?.(next.length >= 3 ? JSON.stringify({ type: 'Polygon', coordinates: [[...next, next[0]]] }) : '')
  const [drawing, setDrawing] = useState<Point[]>(points)
  const current = readOnly ? points : drawing
  async function findPlace() {
    setFindingPlace(true);setGpsError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=12`)
      if (!response.ok) throw new Error('Place lookup is unavailable. Enter the area manually.')
      const data = await response.json();setPlace(data.display_name || 'No place name found.')
    } catch { setGpsError('Place lookup is unavailable. Enter the area manually.') } finally { setFindingPlace(false) }
  }
  function locate() {
    if (!navigator.geolocation) { setGpsError('Geolocation is unavailable. Enter coordinates manually.'); return }
    navigator.geolocation.getCurrentPosition(position => { setLat(position.coords.latitude); setLon(position.coords.longitude); setGpsError('') }, () => setGpsError('Location access denied or unavailable. Enter coordinates manually.'))
  }
  return <div className="mb-3">
    {!readOnly && <><div className="row g-2 mb-2"><label className="col-6">Centre latitude<input type="number" min={-85} max={85} step="any" className="form-control" value={lat} onChange={e => setLat(Math.max(-85, Math.min(85, Number(e.target.value))))} /></label><label className="col-6">Centre longitude<input type="number" min={-180} max={180} step="any" className="form-control" value={lon} onChange={e => setLon(Math.max(-180, Math.min(180, Number(e.target.value))))} /></label></div><button type="button" className="btn btn-sm btn-outline-secondary mb-2" onClick={locate}>Use my location</button><button type="button" disabled={findingPlace} className="btn btn-sm btn-outline-secondary ms-2 mb-2" onClick={() => void findPlace()}>Look up place using OpenStreetMap</button>{place && <p className="small">{place}</p>}</>}
    <div className="d-flex gap-2 mb-2"><button type="button" className="btn btn-sm btn-outline-dark" disabled={zoom >= 18} onClick={() => setZoom(z => z + 1)}>Zoom +</button><button type="button" className="btn btn-sm btn-outline-dark" disabled={zoom <= 4} onClick={() => setZoom(z => z - 1)}>Zoom −</button>{!readOnly && <><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { const next = drawing.slice(0, -1); setDrawing(next); update(next) }}>Undo point</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setDrawing([]); update([]) }}>Clear</button></>}</div>
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', background: '#eef3e8', border: '1px solid #ccc', cursor: readOnly ? 'default' : 'crosshair' }} role="img" aria-label={readOnly ? 'Recorded land boundary' : 'Map click to draw land boundary'} onClick={e => {
      if (readOnly || drawing.length >= 50) return
      const bounds = e.currentTarget.getBoundingClientRect()
      const p = unproject(left + (e.clientX - bounds.left) / bounds.width * width, top + (e.clientY - bounds.top) / bounds.height * height, zoom)
      const next = [...drawing, p]; setDrawing(next); update(next)
    }}>
      {tiles.map(t => <image key={`${zoom}-${t.x}-${t.y}`} x={t.x * tileSize - left} y={t.y * tileSize - top} width={tileSize} height={tileSize} href={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`} onError={() => setTileError(true)} />)}
      <polygon points={current.map(p => { const [x, y] = project(p[0], p[1], zoom); return `${x - left},${y - top}` }).join(' ')} fill="#33884444" stroke="#226b34" strokeWidth={3} />
      {current.map((p, i) => { const [x, y] = project(p[0], p[1], zoom); return <circle key={i} cx={x - left} cy={y - top} r={5} fill="#226b34" /> })}
    </svg>
    <div className="small text-secondary mt-1">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. {readOnly ? 'Boundary entered by the landowner.' : `${drawing.length} points · Click at least three corners; coordinates are saved with the listing.`}</div>
    {tileError && <p className="small text-warning">Map tiles could not load. Coordinates are still saved; check your internet connection.</p>}{gpsError && <p className="small text-danger">{gpsError}</p>}
  </div>
}
