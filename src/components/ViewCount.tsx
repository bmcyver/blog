import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

/**
 * onlyGet: only fetch the view count without incrementing it
 */
export default function ViewCount({
  id,
  onlyGet = false,
}: {
  id: string
  onlyGet?: boolean
}) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchViewCount = async () => {
      const checkKey = `view-check-v1-${id}`
      const cacheKey = `view-cache-v1-${id}`
      try {
        const viewItem = localStorage.getItem(checkKey)
        const cacheItem = localStorage.getItem(cacheKey)

        // If we haven't recorded a view yet, and we're allowed to increment, do so
        if (!viewItem && !onlyGet) {
          const res = await fetch(`/blog/${id}/view`, {
            method: 'POST',
          })
          const data = (await res.json()) as { id: string; count: number }
          localStorage.setItem(checkKey, 'true')
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ count: data.count, timestamp: Date.now() }),
          )
          return setCount(data.count)
        }

        // Check cache for existing view count
        if (cacheItem) {
          const parsed = JSON.parse(cacheItem) as {
            count: number
            timestamp: number
          }
          const now = Date.now()
          // Use cached value if it's less than 3 minutes old
          if (now - parsed.timestamp < 3 * 60 * 1000) {
            return setCount(parsed.count)
          }
        }

        // Fetch the current view count
        const res = await fetch(`/blog/${id}/view`, {
          method: 'GET',
        })
        if (res.ok) {
          const data = (await res.json()) as { id: string; count: number }
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ count: data.count, timestamp: Date.now() }),
          )
          setCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching view count:', error)
      }
    }

    fetchViewCount()
  }, [id])

  if (!count) {
    return (
      <div className="flex items-center gap-1">
        <Skeleton className="bg-primary/5 h-5 w-16" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span>{count} views</span>
    </div>
  )
}
