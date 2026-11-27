/**
 * Navigen Distribution Suite — IndexedDB Visit Image Persistence
 *
 * Stores binary visit presentation images in browser-native IndexedDB
 * instead of storing large Base64 strings inside LocalStorage.
 * Storage errors are explicitly surfaced and never silently swallowed.
 */

const DB_NAME = 'navigen_visit_images'
const DB_VERSION = 1
const STORE_NAME = 'images'

interface StoredVisitImageRecord {
  id: string
  blob: Blob
  fileName: string
  mimeType: string
  savedAt: string
}

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error || new Error('Failed to open IndexedDB for visit image storage.'))
    request.onblocked = () =>
      reject(new Error('IndexedDB connection was blocked while opening image store.'))
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  if (parts.length < 2) {
    throw new Error('Invalid image data URL format.')
  }
  const mimeMatch = parts[0].match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  const byteString = atob(parts[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error || new Error('Failed to decode stored image blob.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Persists a visit presentation image in IndexedDB.
 * Throws/rejects on invalid image or storage failure (never silently ignored).
 */
export async function saveVisitImage(
  imageId: string,
  source: Blob | string,
  fileName = 'presentation.jpg'
): Promise<void> {
  if (!imageId || !imageId.trim()) {
    throw new Error('Image ID is required to store visit presentation image.')
  }

  const blob = typeof source === 'string' ? dataUrlToBlob(source) : source
  if (!blob || blob.size <= 0) {
    throw new Error('Presentation image is empty or corrupted.')
  }

  const db = await openImageDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record: StoredVisitImageRecord = {
      id: imageId,
      blob,
      fileName,
      mimeType: blob.type || 'image/jpeg',
      savedAt: new Date().toISOString(),
    }

    const req = store.put(record)

    req.onerror = () => {
      reject(req.error || new Error('Failed to write presentation image to IndexedDB.'))
    }

    tx.oncomplete = () => {
      db.close()
      resolve()
    }

    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB transaction failed while saving presentation image.'))
    }

    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB transaction aborted (possible storage quota exceeded).'))
    }
  })
}

/**
 * Retrieves a visit presentation image from IndexedDB as a Data URL.
 */
export async function getVisitImage(imageId: string): Promise<string | null> {
  if (!imageId || typeof window === 'undefined' || !window.indexedDB) {
    return null
  }

  const db = await openImageDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(imageId)

    req.onsuccess = async () => {
      db.close()
      const record = req.result as StoredVisitImageRecord | undefined
      if (!record || !record.blob) {
        resolve(null)
        return
      }
      try {
        const dataUrl = await blobToDataUrl(record.blob)
        resolve(dataUrl)
      } catch (err) {
        reject(err)
      }
    }

    req.onerror = () => {
      db.close()
      reject(req.error || new Error('Failed to retrieve visit presentation image from IndexedDB.'))
    }
  })
}

/**
 * Deletes a stored visit image from IndexedDB.
 */
export async function deleteVisitImage(imageId: string): Promise<void> {
  if (!imageId || typeof window === 'undefined' || !window.indexedDB) {
    return
  }
  const db = await openImageDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(imageId)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('Failed to delete visit image from IndexedDB.'))
    }
  })
}
