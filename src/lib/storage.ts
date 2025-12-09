export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      const now = Date.now()

      if (now > item.expiry) {
        localStorage.removeItem(key)
        return null
      }
      return item.value
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return null
    }
  },

  set: <T>(key: string, value: T, ttl: number) => {
    if (typeof window === 'undefined') return
    try {
      const now = Date.now()
      const item = {
        value,
        expiry: now + ttl,
      }
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  },

  remove: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  },
}
