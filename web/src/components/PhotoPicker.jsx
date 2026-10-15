import { useEffect, useMemo, useRef } from 'react'
import { MAX_PHOTO_MB, MAX_PHOTOS } from '../config'

/**
 * FR-05 evidence upload: pick or take photos, preview, remove.
 * value = File[]
 */
export default function PhotoPicker({ value, onChange, error, setError }) {
  const inputRef = useRef(null)
  const previews = useMemo(() => value.map((f) => URL.createObjectURL(f)), [value])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const addFiles = (fileList) => {
    const incoming = [...fileList]
    const tooBig = incoming.find((f) => f.size > MAX_PHOTO_MB * 1024 * 1024)
    const notImage = incoming.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    if (notImage) return setError(`${notImage.name} is not a JPG, PNG or WEBP photo`)
    if (tooBig) return setError(`${tooBig.name} is larger than ${MAX_PHOTO_MB} MB`)
    const next = [...value, ...incoming]
    if (next.length > MAX_PHOTOS) return setError(`You can attach up to ${MAX_PHOTOS} photos`)
    setError('')
    onChange(next)
  }

  return (
    <div>
      <div className="photo-grid">
        {value.map((file, i) => (
          <figure key={previews[i]} className="photo-tile">
            <img src={previews[i]} alt={`Attached photo ${i + 1}`} />
            <button
              type="button"
              className="photo-remove"
              aria-label={`Remove ${file.name}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </figure>
        ))}
        {value.length < MAX_PHOTOS && (
          <button type="button" className="photo-add" onClick={() => inputRef.current?.click()}>
            <span className="fs-3 lh-1">+</span>
            <span className="small">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="form-text">
        Optional. Up to {MAX_PHOTOS} photos, {MAX_PHOTO_MB} MB each. On a phone this opens the camera.
      </div>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </div>
  )
}
