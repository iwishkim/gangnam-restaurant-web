import type { AnalysisCenter } from '../../types/location'

export function AnalysisCenterSummary({ center }: { center: AnalysisCenter }) {
  return <div className="center-summary"><span>{center.mode === 'current' ? '현재 위치' : '지정 위치'}</span><strong>{center.placeName ?? center.address ?? '지도에서 선택한 위치'}</strong><small>{center.latitude.toFixed(6)}, {center.longitude.toFixed(6)} · 반경 500m{center.accuracy != null ? ` · 정확도 ${Math.round(center.accuracy)}m` : ''}</small></div>
}

