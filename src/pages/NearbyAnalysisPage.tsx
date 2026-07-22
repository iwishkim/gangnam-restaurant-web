import { useCallback, useMemo, useState } from 'react'
import { AnalysisLocationSelector } from '../components/location/AnalysisLocationSelector'
import { AnalysisCenterSummary } from '../components/location/AnalysisCenterSummary'
import { RadiusMap } from '../components/map/RadiusMap'
import { PlaceHistoryPanel } from '../components/PlaceHistoryPanel'
import { getPlacesWithinRadius } from '../services/nearbyPlaces'
import type { Restaurant } from '../types/database'
import type { AnalysisCenter, AnalysisMode } from '../types/location'

const SURVIVAL_YEARS = [0, 2, 5, 10, 15, 20]
const COLORS = ['#1d6847', '#c27836', '#536c8a', '#92544c', '#7a6b43', '#6d5280']
const categoryOf = (item: Restaurant) => item.category?.trim() || '미분류'

interface CategorySummary {
  name: string
  active: Restaurant[]
  all: Restaurant[]
}

export function NearbyAnalysisPage() {
  const [mode, setMode] = useState<AnalysisMode>('current')
  const [analysisCenter, setAnalysisCenter] = useState<AnalysisCenter | null>(null)
  const [previewCenter, setPreviewCenter] = useState<AnalysisCenter | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selected, setSelected] = useState<Restaurant | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetResults = useCallback(() => {
    setRestaurants([]); setSelected(null); setSelectedCategory('전체'); setError('')
  }, [])

  const runAnalysis = useCallback(async (center: AnalysisCenter) => {
    setAnalysisCenter(center); setPreviewCenter(null); resetResults(); setLoading(true)
    try { setRestaurants(await getPlacesWithinRadius(center.latitude, center.longitude, 500)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '분석 데이터를 불러오지 못했습니다.') }
    finally { setLoading(false) }
  }, [resetResults])

  const changeMode = (next: AnalysisMode) => {
    setMode(next); setPreviewCenter(null); setAnalysisCenter(null); resetResults()
  }
  const preview = useCallback((center: AnalysisCenter) => {
    setPreviewCenter(center); setAnalysisCenter(null); resetResults()
  }, [resetResults])

  const categories = useMemo<CategorySummary[]>(() => {
    const grouped = new Map<string, Restaurant[]>()
    restaurants.forEach((item) => grouped.set(categoryOf(item), [...(grouped.get(categoryOf(item)) ?? []), item]))
    return [...grouped.entries()].map(([name, all]) => ({
      name, all, active: all.filter((item) => item.is_active),
    })).sort((a, b) => b.active.length - a.active.length || b.all.length - a.all.length)
  }, [restaurants])

  const oldRestaurants = useMemo(() => restaurants
    .filter((item) => item.is_active)
    .filter((item) => selectedCategory === '전체' || categoryOf(item) === selectedCategory)
    .sort((a, b) => (b.operating_years ?? 0) - (a.operating_years ?? 0)),
  [restaurants, selectedCategory])

  const survivalSeries = useMemo(() => categories.slice(0, 6).map((category, index) => ({
    ...category,
    color: COLORS[index],
    values: SURVIVAL_YEARS.map((year) => category.all.length
      ? category.all.filter((item) => (item.operating_years ?? 0) >= year).length / category.all.length * 100
      : 0),
  })), [categories])

  const visibleSeries = selectedCategory === '전체'
    ? survivalSeries
    : survivalSeries.filter((series) => series.name === selectedCategory)

  return <div className="analysis-app">
    <header className="analysis-header">
      <div className="header-copy"><span className="eyebrow">LOCAL LONGEVITY MAP · 500M</span><h1>동네 오래가게 지도</h1><p>내 주변 또는 검색한 위치에서 오래 살아남은 가게를 업종별로 찾고 생존 흐름을 비교합니다.</p></div>
      <div className="radius-badge"><strong>500</strong><span>METERS</span></div>
    </header>
    <main className="analysis-main">
      <section className="journey"><span className="active">01 위치 선택</span><i /><span>02 오래가게 지도</span><i /><span>03 업종 생존 그래프</span></section>
      <div className="location-grid">
        <AnalysisLocationSelector mode={mode} onModeChange={changeMode} onCurrentConfirm={runAnalysis} onPreview={preview} />
        <section className="map-card setup-map"><RadiusMap center={analysisCenter} previewCenter={previewCenter} restaurants={[]} selectedRestaurant={null} allowMapSelection={mode === 'designated'} onMapSelect={preview} onPlaceSelect={setSelected} />
          {previewCenter && <div className="preview-action"><AnalysisCenterSummary center={previewCenter} /><button className="primary-button" onClick={() => runAnalysis(previewCenter)}>이 위치에서 찾기</button></div>}
        </section>
      </div>
      {analysisCenter ? <section className="analysis-results">
        <div className="results-title"><AnalysisCenterSummary center={analysisCenter} /><span>반경 500m · {restaurants.length}개 영업 이력</span></div>
        {loading ? <div className="loading-state">주변 가게의 영업 이력을 찾고 있습니다.</div> : error ? <div className="error-state" role="alert">{error}</div> : <>
          <section className="old-map-section">
            <div className="step-heading"><span>STEP 01 · LONG-LIVED PLACES</span><h2>업종별 오래된 가게를 지도에서 보세요</h2><p>현재 영업 중인 가게를 운영 기간이 오래된 순서대로 표시합니다.</p></div>
            <div className="category-chips" aria-label="업종 필터">
              <button className={selectedCategory === '전체' ? 'active' : ''} onClick={() => setSelectedCategory('전체')}>전체 <b>{restaurants.filter((r) => r.is_active).length}</b></button>
              {categories.map((category) => <button key={category.name} className={selectedCategory === category.name ? 'active' : ''} onClick={() => setSelectedCategory(category.name)}>{category.name} <b>{category.active.length}</b></button>)}
            </div>
            <div className="age-filter"><strong>오래된 순</strong><span>{oldRestaurants.length}곳 표시 중</span></div>
            <div className="old-map-layout">
              <div className="old-map"><RadiusMap center={analysisCenter} previewCenter={null} restaurants={oldRestaurants} selectedRestaurant={selected} allowMapSelection={false} onMapSelect={() => undefined} onPlaceSelect={setSelected} /></div>
              <div className="old-list">{oldRestaurants.length ? oldRestaurants.map((item, index) => <button key={item.restaurant_id} onClick={() => setSelected(item)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.business_name ?? '상호명 없음'}</strong><small>{categoryOf(item)} · {item.road_address ?? '주소 정보 없음'}</small></div><em>{item.operating_years?.toFixed(1)}년</em></button>) : <p>조건에 맞는 영업 중 가게가 없습니다.</p>}</div>
            </div>
          </section>
          <section className="survival-section">
            <div className="step-heading"><span>STEP 02 · SURVIVAL CURVE</span><h2>업종별 생존 그래프</h2><p>해당 위치의 전체 영업 이력 중 각 운영 기간까지 살아남은 비율입니다.</p></div>
            {visibleSeries.length ? <div className="survival-card">
              <div className="chart-legend">{visibleSeries.map((series) => <span key={series.name}><i style={{ background: series.color }} />{series.name}</span>)}</div>
              <div className="chart-shell"><div className="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><svg viewBox="0 0 800 300" role="img" aria-label="업종별 생존율 선 그래프">
                {[0, 75, 150, 225, 300].map((y) => <line key={y} x1="0" x2="800" y1={y} y2={y} className="grid-line" />)}
                {visibleSeries.map((series) => <polyline key={series.name} points={series.values.map((value, index) => `${index * 160},${300 - value * 3}`).join(' ')} fill="none" stroke={series.color} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />)}
              </svg></div>
              <div className="x-axis">{SURVIVAL_YEARS.map((year) => <span key={year}>{year}년</span>)}</div>
              <p className="chart-note">※ 행정 인허가 이력 기반 단순 잔존율이며, 미래 생존 가능성을 예측하는 지표는 아닙니다.</p>
            </div> : <p className="no-category-data">선택한 업종의 생존 그래프 데이터가 부족합니다.</p>}
          </section>
        </>}
      </section> : <section className="empty-analysis"><strong>먼저 기준 위치를 선택해 주세요.</strong><p>현재 위치를 확인하거나 장소를 검색하면 오래된 가게 지도부터 보여드립니다.</p></section>}
    </main>
    {selected && <PlaceHistoryPanel restaurant={selected} onClose={() => setSelected(null)} />}
  </div>
}
