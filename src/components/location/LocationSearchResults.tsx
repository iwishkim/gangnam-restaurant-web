import type { KakaoPlaceResult } from '../../types/location'

export function LocationSearchResults({ results, onSelect }: { results: KakaoPlaceResult[]; onSelect: (place: KakaoPlaceResult) => void }) {
  return <ul className="search-results">{results.map((place) => <li key={place.id}><button type="button" onClick={() => onSelect(place)}><strong>{place.placeName}</strong><span>{place.roadAddress || '도로명주소 없음'}</span><small>{place.address}</small></button></li>)}</ul>
}

