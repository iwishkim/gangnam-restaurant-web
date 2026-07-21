import type { AnalysisCenter, AnalysisMode } from '../../types/location'
import { CurrentLocationPanel } from './CurrentLocationPanel'
import { DesignatedLocationSearch } from './DesignatedLocationSearch'

interface Props { mode: AnalysisMode; onModeChange: (mode: AnalysisMode) => void; onCurrentConfirm: (center: AnalysisCenter) => void; onPreview: (center: AnalysisCenter) => void }
export function AnalysisLocationSelector({ mode, onModeChange, onCurrentConfirm, onPreview }: Props) {
  return <section className="location-selector"><div className="mode-tabs"><button className={mode === 'current' ? 'active' : ''} onClick={() => onModeChange('current')}>현재 위치</button><button className={mode === 'designated' ? 'active' : ''} onClick={() => onModeChange('designated')}>지정 위치</button></div>{mode === 'current' ? <CurrentLocationPanel onConfirm={onCurrentConfirm}/> : <DesignatedLocationSearch onPreview={onPreview}/>}</section>
}
