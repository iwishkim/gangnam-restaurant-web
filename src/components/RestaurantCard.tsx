import type { Restaurant } from '../types/database'

interface Props { restaurant: Restaurant; selected: boolean; onSelect: (restaurant: Restaurant) => void }
const date = (value: string | null) => value ? value.slice(0, 10) : '—'

export function RestaurantCard({ restaurant, selected, onSelect }: Props) {
  return <article className={`restaurant-card${selected ? ' selected' : ''}`}>
    <div className="card-heading"><div><span className="category">{restaurant.category ?? '업종 미분류'}</span><h3>{restaurant.business_name ?? '상호명 없음'}</h3></div><span className={`status ${restaurant.is_active ? 'active' : 'closed'}`}>{restaurant.is_active ? '영업 중' : '폐업'}</span></div>
    <p className="address">{restaurant.road_address ?? restaurant.lot_address ?? restaurant.normalized_address ?? '주소 정보 없음'}</p>
    <dl><div><dt>허가일</dt><dd>{date(restaurant.license_date)}</dd></div><div><dt>폐업일</dt><dd>{date(restaurant.closure_date)}</dd></div><div><dt>영업기간</dt><dd>{restaurant.operating_years == null ? '—' : `${restaurant.operating_years.toFixed(1)}년`}</dd></div></dl>
    <button type="button" className="map-button" onClick={() => onSelect(restaurant)}>지도에서 보기</button>
  </article>
}
