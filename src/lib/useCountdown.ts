import { useEffect, useState } from 'react'
import { getCountdown, type CountdownParts } from './countdown'

export function useCountdown(): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => getCountdown())
  useEffect(() => {
    const id = setInterval(() => setParts(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])
  return parts
}
