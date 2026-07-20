export interface Filters { search: string; status: 'all' | 'active' | 'closed'; category: string }
interface Props { filters: Filters; categories: string[]; onChange: (filters: Filters) => void; onReset: () => void }

export function FilterBar({ filters, categories, onChange, onReset }: Props) {
  return <section className="filters" aria-label="음식점 검색 및 필터">
    <div className="search-field"><label htmlFor="restaurant-search">상호명 또는 주소 검색</label><input id="restaurant-search" type="search" value={filters.search} placeholder="예: 역삼동, 한식당" onChange={(e) => onChange({ ...filters, search: e.target.value })} /></div>
    <div><label htmlFor="status-filter">영업 상태</label><select id="status-filter" value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value as Filters['status'] })}><option value="all">영업 전체</option><option value="active">영업 중</option><option value="closed">폐업</option></select></div>
    <div><label htmlFor="category-filter">업종</label><select id="category-filter" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}><option value="">업종 전체</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
    <button className="reset-button" type="button" onClick={onReset}>검색 초기화</button>
  </section>
}
