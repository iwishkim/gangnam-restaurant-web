import type { KakaoPlaceResult } from '../types/location'

interface KakaoRawPlace { id: string; place_name: string; road_address_name: string; address_name: string; x: string; y: string }
export interface KakaoLatLng { getLat(): number; getLng(): number }
export interface KakaoMapInstance { setCenter(position: KakaoLatLng): void; setLevel(level: number): void }
export interface KakaoOverlay { setMap(map: KakaoMapInstance | null): void; setPosition?(position: KakaoLatLng): void; setCenter?(position: KakaoLatLng): void }
export interface KakaoMapsApi {
  load(callback: () => void): void
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng
  Map: new (element: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance
  Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng }) => KakaoOverlay
  Circle: new (options: { map: KakaoMapInstance; center: KakaoLatLng; radius: number; strokeWeight: number; strokeColor: string; strokeOpacity: number; fillColor: string; fillOpacity: number }) => KakaoOverlay
  event: { addListener(target: KakaoMapInstance | KakaoOverlay, type: string, handler: (event: { latLng: KakaoLatLng }) => void): void }
  services: {
    Places: new () => { keywordSearch(keyword: string, callback: (data: KakaoRawPlace[], status: string) => void): void }
    Status: { OK: string; ZERO_RESULT: string }
  }
}

declare global { interface Window { kakao?: { maps: KakaoMapsApi } } }
let sdkPromise: Promise<KakaoMapsApi> | null = null

export function loadKakaoSdk(): Promise<KakaoMapsApi> {
  if (window.kakao?.maps) return new Promise((resolve) => window.kakao!.maps.load(() => resolve(window.kakao!.maps)))
  if (sdkPromise) return sdkPromise
  const key = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY
  if (!key) return Promise.reject(new Error('카카오 지도 JavaScript 키가 설정되지 않았습니다.'))
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`
    script.onload = () => window.kakao?.maps.load(() => resolve(window.kakao!.maps))
    script.onerror = () => reject(new Error('카카오 지도 서비스를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

export async function searchKakaoPlaces(keyword: string): Promise<KakaoPlaceResult[]> {
  const maps = await loadKakaoSdk()
  return new Promise((resolve, reject) => {
    new maps.services.Places().keywordSearch(keyword, (data, status) => {
      if (status === maps.services.Status.ZERO_RESULT) { resolve([]); return }
      if (status !== maps.services.Status.OK) { reject(new Error('장소 검색 중 오류가 발생했습니다.')); return }
      resolve(data.map((item) => ({ id: item.id, placeName: item.place_name, roadAddress: item.road_address_name, address: item.address_name, latitude: Number(item.y), longitude: Number(item.x) })))
    })
  })
}
