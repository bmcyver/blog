import { Skeleton } from '@/components/ui/skeleton'
import { storage } from '@/lib/storage'
import { viewsTable } from '@/schema'
import { useEffect, useState } from 'react'

const COUNT_TTL = 5 * 60 * 1000 // 5 minutes
const INC_TTL = 12 * 60 * 60 * 1000 // 12 hours

/**
 * inc: whether to increment the view count
 */
export default function ViewCount({
  id,
  inc = false,
}: {
  id: string
  inc?: boolean
}) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchViewCount = async () => {
      const countKey = `view-count-v1-${id}`
      const incKey = `view-inc-v1-${id}`

      try {
        const cachedCount = storage.get<number>(countKey)
        const hasIncremented = storage.get<boolean>(incKey)

        // If we haven't recorded a view yet, and we're allowed to increment, do so
        if (inc && !hasIncremented) {
          const res = await fetch(`/blog/${id}/view`, {
            method: 'POST',
          })
          if (res.ok) {
            const data = (await res.json()) as { id: string; count: number }
            storage.set(countKey, data.count, COUNT_TTL)
            storage.set(incKey, true, INC_TTL)
            return setCount(data.count)
          }
        }

        // Check cache for existing view count
        if (cachedCount !== null) {
          return setCount(cachedCount)
        }

        // Fetch the current view count
        const res = await fetch(`/blog/${id}/view`, {
          method: 'GET',
        })
        if (res.ok) {
          const data = (await res.json()) as typeof viewsTable.$inferSelect
          storage.set(countKey, data.count, COUNT_TTL)
          return setCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching view count:', error)
      }
    }

    fetchViewCount()
  }, [id, inc])

  if (count === null) {
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
