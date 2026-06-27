/**
 * Wrapper mínimo de IndexedDB para guardar dados maiores que o localStorage
 * comporta (ex.: fotos das sessões). Um único object store "sessoes".
 */
const DB_NAME = 'controly'
const VERSION = 1
export const SESSOES_STORE = 'sessoes'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(SESSOES_STORE)) {
        const store = db.createObjectStore(SESSOES_STORE, { keyPath: 'id' })
        store.createIndex('pacienteId', 'pacienteId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export async function idbPut<T>(store: string, value: T): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Retorna todos os registros cujo índice `indexName` é igual a `value`. */
export async function idbAllByIndex<T>(
  store: string,
  indexName: string,
  value: IDBValidKey,
): Promise<T[]> {
  const db = await openDb()
  return new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).index(indexName).getAll(value)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}
