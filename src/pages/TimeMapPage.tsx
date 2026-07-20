import { useCallback, useMemo, useState } from 'react'
import { FilterBar, type Filters } from '../components/FilterBar'
import { KakaoMap } from '../components/KakaoMap'
import { PlaceHistoryPanel } from '../components/PlaceHistoryPanel'
import { RestaurantCard } from '../components/RestaurantCard'
import { useRestaurants } from '../hooks/useRestaurants'
import type { Restaurant } from '../types/database'

const emptyFilters: Filters = { search: '', status: 'all', category: '' }

export function TimeMapPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
  const query = useMemo(() => ({ ...filters, limit: 100 }), [filters])
  const { restaurants, categories, loading, error } = useRestaurants(query)
  const selected = useMemo(
    () => restaurants.find((restaurant) => restaurant.restaurant_id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId],
  )
  const selectRestaurant = useCallback((restaurant: Restaurant) => setSelectedRestaurantId(restaurant.restaurant_id), [])
  return <div className="app-shell">
    <header className="site-header"><div className="brand-mark" aria-hidden="true">⌖</div><div><h1>강남 음식점 타임맵</h1><p>장소별 음식점의 개업과 폐업 이력을 확인합니다.</p></div></header>
    <main>
      <FilterBar filters={filters} categories={categories} onChange={setFilters} onReset={() => { setFilters(emptyFilters); setSelectedRestaurantId(null) }} />
      <div className="workspace">
        <section className="map-section" aria-label="지도 영역"><div className="section-label"><span>GANGNAM-GU · SEOUL</span><span className="legend"><i /> 영업 중 <i /> 폐업</span></div><KakaoMap restaurants={restaurants} selected={selected} onSelect={selectRestaurant} /></section>
        <section className="results" aria-labelledby="results-title">
          <div className="results-heading"><div><span>RESTAURANTS</span><h2 id="results-title">음식점 검색 결과</h2></div><strong>{loading ? '—' : restaurants.length}<small>개</small></strong></div>
          <div className="result-list" aria-live="polite">
            {loading && <div className="state"><span className="spinner" />음식점을 불러오는 중입니다.</div>}
            {error && <div className="state error" role="alert"><strong>데이터를 불러오지 못했습니다.</strong><span>{error}</span></div>}
            {!loading && !error && restaurants.length === 0 && <div className="state"><strong>검색 결과가 없습니다.</strong><span>검색어나 필터를 변경해 보세요.</span></div>}
            {!loading && !error && restaurants.map((restaurant) => <RestaurantCard key={restaurant.restaurant_id} restaurant={restaurant} selected={selected?.restaurant_id === restaurant.restaurant_id} onSelect={selectRestaurant} />)}
          </div>
        </section>
      </div>
    </main>
    {selected?.place_id
      ? <PlaceHistoryPanel restaurant={selected} onClose={() => setSelectedRestaurantId(null)} />
      : selected && <div className="place-history-notice" role="status">이 장소는 연결된 이력 정보가 없습니다</div>}
  </div>
}
