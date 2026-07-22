import { useEffect, useRef, useState } from 'react'
import { loadKakaoSdk, type KakaoMapInstance, type KakaoOverlay } from '../../services/kakaoPlaceSearch'
import type { Restaurant } from '../../types/database'
import type { AnalysisCenter } from '../../types/location'

interface Props { center: AnalysisCenter | null; previewCenter: AnalysisCenter | null; restaurants: Restaurant[]; selectedRestaurant?: Restaurant | null; allowMapSelection: boolean; onMapSelect: (center: AnalysisCenter) => void; onPlaceSelect: (restaurant: Restaurant) => void }

export function RadiusMap({ center, previewCenter, restaurants, selectedRestaurant, allowMapSelection, onMapSelect, onPlaceSelect }: Props) {
  const element = useRef<HTMLDivElement>(null)
  const map = useRef<KakaoMapInstance | null>(null)
  const centerMarker = useRef<KakaoOverlay | null>(null)
  const circle = useRef<KakaoOverlay | null>(null)
  const placeMarkers = useRef<KakaoOverlay[]>([])
  const clickEnabled = useRef(allowMapSelection)
  const [error, setError] = useState('')
  useEffect(() => { clickEnabled.current = allowMapSelection }, [allowMapSelection])

  useEffect(() => {
    let active = true
    loadKakaoSdk().then((maps) => {
      if (!active || !element.current || map.current) return
      const initial = new maps.LatLng(37.4979, 127.0276)
      map.current = new maps.Map(element.current, { center: initial, level: 5 })
      maps.event.addListener(map.current, 'click', (event) => {
        if (!clickEnabled.current) return
        onMapSelect({ mode: 'designated', latitude: event.latLng.getLat(), longitude: event.latLng.getLng(), accuracy: null, address: null, placeName: null, selectedAt: new Date().toISOString() })
      })
    }).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : '지도를 불러오지 못했습니다.'))
    return () => { active = false }
  }, [onMapSelect])

  useEffect(() => {
    const shown = previewCenter ?? center
    if (!shown || !map.current) return
    void loadKakaoSdk().then((maps) => {
      if (!map.current) return
      const position = new maps.LatLng(shown.latitude, shown.longitude)
      map.current.setCenter(position)
      centerMarker.current?.setMap(null); circle.current?.setMap(null)
      centerMarker.current = new maps.Marker({ map: map.current, position })
      circle.current = new maps.Circle({ map: map.current, center: position, radius: 500, strokeWeight: 2, strokeColor: '#236847', strokeOpacity: .85, fillColor: '#72ad89', fillOpacity: .16 })
    })
  }, [center, previewCenter])

  useEffect(() => {
    if (!map.current) return
    void loadKakaoSdk().then((maps) => {
      placeMarkers.current.forEach((marker) => marker.setMap(null)); placeMarkers.current = []
      if (!map.current) return
      const unique = new Map<string, Restaurant>()
      restaurants.forEach((item) => { if (item.place_id && item.latitude != null && item.longitude != null) unique.set(item.place_id, item) })
      placeMarkers.current = [...unique.values()].map((item) => {
        const marker = new maps.Marker({ map: map.current!, position: new maps.LatLng(item.latitude!, item.longitude!) })
        maps.event.addListener(marker, 'click', () => onPlaceSelect(item))
        return marker
      })
    })
  }, [restaurants, onPlaceSelect])

  useEffect(() => {
    if (!map.current || selectedRestaurant?.latitude == null || selectedRestaurant.longitude == null) return
    void loadKakaoSdk().then((maps) => {
      if (!map.current) return
      map.current.setCenter(new maps.LatLng(selectedRestaurant.latitude!, selectedRestaurant.longitude!))
      map.current.setLevel(3)
    })
  }, [selectedRestaurant])

  if (error) return <div className="radius-map map-error" role="alert">{error}</div>
  return <div ref={element} className="radius-map" aria-label="분석 반경 지도" />
}
