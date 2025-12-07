import { useEffect, useState } from 'react';

interface ViewCountProps {
  id: string;
}

export default function ViewCount({ id }: ViewCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchViewCount = async () => {
      const viewKey = `view-${id}`;
      try {
        let viewed = localStorage.getItem(viewKey);
        if (!viewed) {
          await fetch(`/blog/${id}/view`, {
            method: 'POST',
          });
          localStorage.setItem(viewKey, 'true');
        }

        const res = await fetch(`/blog/${id}/view`, {
          method: 'GET',
        });
        if (res.ok) {
          const data = await res.json() as { id: string; count: number };
          setCount(data.count);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, [id]);

  if (error) {
    return (
      <div className="flex items-center gap-1">
        <span>Failed to load</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span>{count} views</span>
    </div>
  );
}
