import { useEffect, useState } from 'react'
import { getPlaceHistory } from '../services/restaurants'
import type { Restaurant } from '../types/database'

interface Props { restaurant: Restaurant; onClose: () => void }
const date = (value: string | null) => value ? value.slice(0, 10) : '현재'

export function PlaceHistoryPanel({ restaurant, onClose }: Props) {
  const [history, setHistory] = useState<Restaurant[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    if (!restaurant.place_id) return () => { active = false }
    void Promise.resolve().then(() => { if (active) { setLoading(true); setError('') } })
    void getPlaceHistory(restaurant.place_id).then((items) => active && setHistory(items)).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : '이력을 불러오지 못했습니다.')).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [restaurant])
  return <aside className="history-panel" aria-labelledby="history-title">
    <div className="history-header"><div><span>PLACE HISTORY</span><h2 id="history-title">이 장소의 음식점 이력</h2></div><button type="button" aria-label="장소 이력 닫기" onClick={onClose}>×</button></div>
    <p className="history-address">{restaurant.road_address ?? restaurant.lot_address ?? restaurant.normalized_address}</p>
    {loading && <p className="state">이력을 불러오는 중입니다.</p>}{error && <p className="state error">{error}</p>}
    {!loading && !error && <ol className="timeline">{history.map((item) => <li key={item.restaurant_id} className={item.is_active ? 'current' : ''}><span className="dot" /><div><div className="timeline-title"><strong>{item.business_name ?? '상호명 없음'}</strong><span>{item.is_active ? '영업 중' : '폐업'}</span></div><p>{date(item.license_date)} — {date(item.closure_date)}</p></div></li>)}</ol>}
  </aside>
}
