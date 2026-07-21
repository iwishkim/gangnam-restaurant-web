export type AnalysisMode = 'current' | 'designated'

export interface AnalysisCenter {
  mode: AnalysisMode
  latitude: number
  longitude: number
  accuracy: number | null
  address: string | null
  placeName: string | null
  selectedAt: string
}

export interface KakaoPlaceResult {
  id: string
  placeName: string
  roadAddress: string
  address: string
  latitude: number
  longitude: number
}

