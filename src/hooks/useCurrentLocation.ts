import { useCallback, useState } from 'react'

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'error'

export function useCurrentLocation() {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [position, setPosition] = useState<GeolocationPosition | null>(null)

  const measure = useCallback(() => {
    if (!navigator.geolocation) { setStatus('unsupported'); return }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (next) => { setPosition(next); setStatus('success') },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : error.code === error.POSITION_UNAVAILABLE ? 'unavailable' : error.code === error.TIMEOUT ? 'timeout' : 'error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }, [])

  return { status, position, measure }
}

