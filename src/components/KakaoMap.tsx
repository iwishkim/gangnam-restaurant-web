import { useEffect, useRef, useState } from 'react'
import type { Restaurant } from '../types/database'

interface LatLng { getLat(): number; getLng(): number }
interface MapInstance { setCenter(position: LatLng): void; setLevel(level: number): void }
interface MarkerInstance {
  setMap(map: MapInstance | null): void
  restaurant_id: string
  place_id: string | null
}
interface KakaoMaps {
  load(callback: () => void): void
  LatLng: new (latitude: number, longitude: number) => LatLng
  Map: new (element: HTMLElement, options: { center: LatLng; level: number }) => MapInstance
  Marker: new (options: { map: MapInstance; position: LatLng }) => MarkerInstance
  event: { addListener(target: MarkerInstance, type: 'click', handler: () => void): void }
}
declare global { interface Window { kakao?: { maps: KakaoMaps } } }

interface Props { restaurants: Restaurant[]; selected: Restaurant | null; onSelect: (restaurant: Restaurant) => void }
let sdkPromise: Promise<KakaoMaps> | null = null

function loadKakaoMap(): Promise<KakaoMaps> {
  if (window.kakao?.maps) return new Promise((resolve) => window.kakao?.maps.load(() => resolve(window.kakao!.maps)))
  if (sdkPromise) return sdkPromise
  const key = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY
  if (!key) return Promise.reject(new Error('VITE_KAKAO_MAP_JAVASCRIPT_KEY가 설정되지 않았습니다.'))
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`
    script.onload = () => window.kakao?.maps.load(() => resolve(window.kakao!.maps))
    script.onerror = () => reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function KakaoMap({ restaurants, selected, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<MapInstance | null>(null)
  const markers = useRef<MarkerInstance[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    loadKakaoMap().then((maps) => {
      if (!active || !container.current) return
      const initial = restaurants[0]
      const center = new maps.LatLng(initial?.latitude ?? 37.4979, initial?.longitude ?? 127.0276)
      map.current = new maps.Map(container.current, { center, level: 5 })
      markers.current = restaurants.map((item) => {
        const marker = new maps.Marker({ map: map.current!, position: new maps.LatLng(item.latitude!, item.longitude!) })
        marker.restaurant_id = item.restaurant_id
        marker.place_id = item.place_id
        maps.event.addListener(marker, 'click', () => {
          console.info('Restaurant marker clicked', {
            restaurant_id: marker.restaurant_id,
            place_id: marker.place_id,
            business_name: item.business_name,
            road_address: item.road_address,
            latitude: item.latitude,
            longitude: item.longitude,
          })
          onSelect(item)
        })
        return marker
      })
    }).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.'))
    return () => { active = false; markers.current.forEach((marker) => marker.setMap(null)); markers.current = [] }
  }, [restaurants, onSelect])
  useEffect(() => {
    if (!selected || !map.current || !window.kakao) return
    map.current.setCenter(new window.kakao.maps.LatLng(selected.latitude!, selected.longitude!)); map.current.setLevel(3)
  }, [selected])
  if (error) return <div className="map-error" role="alert"><strong>지도를 표시할 수 없습니다.</strong><span>{error}</span></div>
  return <div ref={container} className="map" aria-label="강남구 음식점 지도" />
}
