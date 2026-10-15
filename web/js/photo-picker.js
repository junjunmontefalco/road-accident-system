// FR-05 evidence upload: pick or take photos, preview, remove.
// Photos are shrunk in the browser before upload (faster on mobile data, and the
// server stores them inside Firestore, which allows about 1 MB per photo).
import { MAX_PHOTO_MB } from './config.js'
import { esc } from './ui.js'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIDE = 1600

/** Shrink one image to a JPEG. Falls back to the original file if the browser can't. */
export async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.type === 'image/jpeg' && file.size < 900 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/**
 * Mount the picker in `container`. Returns { files(), clear() }.
 * max: how many photos may still be attached.
 */
export function mountPhotoPicker(container, { max = 5, onError = () => {} } = {}) {
  let files = []
  let urls = []
  container.innerHTML = `
    <div class="photo-grid" data-grid></div>
    <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-input>
    <div class="form-text">Optional. Up to <span data-max>${max}</span> photos (JPG, PNG or WEBP). On a phone this can open the camera.</div>`
  const grid = container.querySelector('[data-grid]')
  const input = container.querySelector('[data-input]')

  const render = () => {
    urls.forEach((u) => URL.revokeObjectURL(u))
    urls = files.map((f) => URL.createObjectURL(f))
    grid.innerHTML =
      files
        .map(
          (f, i) => `<figure class="photo-tile">
            <img src="${urls[i]}" alt="Attached photo ${i + 1}">
            <button type="button" class="photo-remove" data-remove="${i}" aria-label="Remove ${esc(f.name)}">×</button>
          </figure>`,
        )
        .join('') +
      (files.length < max
        ? `<button type="button" class="photo-add" data-add><span class="fs-3 lh-1">+</span><span class="small">Add photo</span></button>`
        : '')
    grid.querySelector('[data-add]')?.addEventListener('click', () => input.click())
    grid.querySelectorAll('[data-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        files.splice(Number(b.dataset.remove), 1)
        render()
      }),
    )
  }

  input.addEventListener('change', async () => {
    const incoming = [...input.files]
    input.value = ''
    const notImage = incoming.find((f) => !TYPES.includes(f.type))
    if (notImage) return onError(`${notImage.name} is not a JPG, PNG or WEBP photo`)
    const tooBig = incoming.find((f) => f.size > MAX_PHOTO_MB * 1024 * 1024)
    if (tooBig) return onError(`${tooBig.name} is larger than ${MAX_PHOTO_MB} MB`)
    if (files.length + incoming.length > max) return onError(`You can attach up to ${max} photos`)
    onError('')
    const add = grid.querySelector('[data-add]')
    if (add) add.innerHTML = '<span class="spinner-border spinner-border-sm"></span><span class="small">Preparing…</span>'
    files = files.concat(await Promise.all(incoming.map(shrinkImage)))
    render()
  })

  render()
  return {
    files: () => files,
    clear: () => {
      files = []
      render()
    },
  }
}
