import { useEffect, useState } from 'react'
import { getPlaceHistory } from '../services/restaurants'
import type { Restaurant } from '../types/database'

interface Props { restaurant: Restaurant; onClose: () => void }
const date = (value: string | null) => value ? value.slice(0, 10) : '현재'
const kakaoMapUrl = (restaurant: Restaurant, type: 'map' | 'to') => {
  if (restaurant.latitude == null || restaurant.longitude == null) return null
  const name = encodeURIComponent(restaurant.business_name ?? '선택한 가게')
  return `https://map.kakao.com/link/${type}/${name},${restaurant.latitude},${restaurant.longitude}`
}

export function PlaceHistoryPanel({ restaurant, onClose }: Props) {
  const [history, setHistory] = useState<Restaurant[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    if (!restaurant.place_id) {
      void Promise.resolve().then(() => { if (active) { setHistory([]); setError(''); setLoading(false) } })
      return () => { active = false }
    }
    void Promise.resolve().then(() => { if (active) { setLoading(true); setError('') } })
    void getPlaceHistory(restaurant.place_id).then((items) => active && setHistory(items)).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : '이력을 불러오지 못했습니다.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [restaurant])
  const mapUrl = kakaoMapUrl(restaurant, 'map')
  const directionsUrl = kakaoMapUrl(restaurant, 'to')
  return <aside className="history-panel" aria-labelledby="history-title">
    <div className="history-header"><div><span>PLACE MAP & HISTORY</span><h2 id="history-title">{restaurant.business_name ?? '선택한 가게'}</h2></div><button type="button" aria-label="가게 정보 닫기" onClick={onClose}>×</button></div>
    <p className="history-address">{restaurant.road_address ?? restaurant.lot_address ?? restaurant.normalized_address}</p>
    {directionsUrl && mapUrl && <div className="place-map-actions">
      <a className="directions-button" href={directionsUrl} target="_blank" rel="noreferrer">카카오맵 길찾기</a>
      <a href={mapUrl} target="_blank" rel="noreferrer">큰 지도에서 보기</a>
    </div>}
    {loading && <p className="state">이력을 불러오는 중입니다.</p>}{error && <p className="state error">{error}</p>}
    {!loading && !error && history.length > 0 && <ol className="timeline">{history.map((item) => <li key={item.restaurant_id} className={item.is_active ? 'current' : ''}><span className="dot" /><div><div className="timeline-title"><strong>{item.business_name ?? '상호명 없음'}</strong><span>{item.is_active ? '영업 중' : '폐업'}</span></div><p>{date(item.license_date)} — {date(item.closure_date)}</p></div></li>)}</ol>}
  </aside>
}
