import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api/client'

/** Unread notification count; refreshes on every page change and every 60 seconds. */
export default function useUnreadCount() {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()
  useEffect(() => {
    let alive = true
    const load = () =>
      api('/notifications/list.php', { query: { unread: 1 } })
        .then((d) => alive && setCount(d.unread_count))
        .catch(() => {})
    load()
    const t = setInterval(load, 60000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pathname])
  return count
}
