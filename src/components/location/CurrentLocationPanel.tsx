import { useEffect } from 'react'
import { useCurrentLocation } from '../../hooks/useCurrentLocation'
import type { AnalysisCenter } from '../../types/location'

const messages = { denied: '위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.', unavailable: '현재 위치를 확인할 수 없습니다.', timeout: '위치 확인 시간이 초과되었습니다.', unsupported: '이 브라우저는 위치 기능을 지원하지 않습니다.', error: '현재 위치를 가져오지 못했습니다.' }
const accuracyLabel = (accuracy: number) => accuracy <= 50 ? '정확도 양호' : accuracy <= 150 ? '다소 부정확' : '다시 측정 권장'

export function CurrentLocationPanel({ onConfirm }: { onConfirm: (center: AnalysisCenter) => void }) {
  const { status, position, measure } = useCurrentLocation()
  useEffect(() => {
    if (!position) return
    onConfirm({ mode: 'current', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, address: null, placeName: '현재 위치', selectedAt: new Date().toISOString() })
  }, [position, onConfirm])
  return <div className="location-panel">
    <p>버튼을 누르면 브라우저가 위치 권한을 요청합니다. 좌표는 서버에 저장하지 않습니다.</p>
    <button className="primary-button" type="button" onClick={measure} disabled={status === 'loading'}>{status === 'loading' ? '위치 확인 중…' : position ? '다시 측정' : '현재 위치 확인'}</button>
    {position && <p className="accuracy">정확도 약 {Math.round(position.coords.accuracy)}m · <strong>{accuracyLabel(position.coords.accuracy)}</strong></p>}
    {status in messages && <p className="inline-error" role="alert">{messages[status as keyof typeof messages]}</p>}
  </div>
}

