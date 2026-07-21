import { useState } from 'react'
import { searchKakaoPlaces } from '../../services/kakaoPlaceSearch'
import type { AnalysisCenter, KakaoPlaceResult } from '../../types/location'
import { LocationSearchResults } from './LocationSearchResults'

export function DesignatedLocationSearch({ onPreview }: { onPreview: (center: AnalysisCenter) => void }) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<KakaoPlaceResult[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const search = async (event: React.FormEvent) => {
    event.preventDefault(); if (!keyword.trim()) return
    setLoading(true); setMessage('')
    try { const next = await searchKakaoPlaces(keyword.trim()); setResults(next); if (!next.length) setMessage('검색 결과가 없습니다. 다른 주소나 장소명을 입력해 보세요.') }
    catch (reason) { setResults([]); setMessage(reason instanceof Error ? reason.message : '장소 검색에 실패했습니다.') }
    finally { setLoading(false) }
  }
  const select = (place: KakaoPlaceResult) => onPreview({ mode: 'designated', latitude: place.latitude, longitude: place.longitude, accuracy: null, address: place.roadAddress || place.address, placeName: place.placeName, selectedAt: new Date().toISOString() })
  return <div className="location-panel"><form className="place-search" onSubmit={search}><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="주소 또는 장소 키워드" aria-label="주소 또는 장소 검색"/><button className="primary-button" disabled={loading}>{loading ? '검색 중…' : '검색'}</button></form>{message && <p className="search-message" role="status">{message}</p>}<LocationSearchResults results={results} onSelect={select}/><p className="map-help">또는 오른쪽 지도에서 원하는 지점을 클릭하세요.</p></div>
}

