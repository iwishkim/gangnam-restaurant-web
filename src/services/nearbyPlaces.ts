import { supabase } from '../lib/supabase'
import { logSupabaseError, restaurantColumns, toRestaurant } from './restaurants'
import type { Restaurant, RestaurantRow } from '../types/database'

interface RadiusRow { place_id: string; latitude: number | null; longitude: number | null }

export async function getPlacesWithinRadius(latitude: number, longitude: number, radiusMeters = 500): Promise<Restaurant[]> {
  const { data: places, error: radiusError } = await supabase.rpc('places_within_radius', {
    center_latitude: latitude, center_longitude: longitude, radius_meters: radiusMeters,
  })
  if (radiusError) {
    logSupabaseError('반경 내 장소 조회 실패', radiusError)
    throw new Error(`반경 내 장소 조회에 실패했습니다: ${radiusError.message}`)
  }

  const radiusRows = (places ?? []) as RadiusRow[]
  const placeIds = [...new Set(radiusRows.map((row) => row.place_id).filter(Boolean))]
  if (placeIds.length === 0) return []

  const locations = new Map(radiusRows.map((row) => [row.place_id, row]))
  const batches = Array.from({ length: Math.ceil(placeIds.length / 50) }, (_, index) => placeIds.slice(index * 50, index * 50 + 50))
  const results = await Promise.all(batches.map(async (batch) => {
    const { data, error } = await supabase.from('restaurants').select(restaurantColumns).in('place_id', batch).order('license_date', { ascending: true, nullsFirst: false })
    if (error) {
      logSupabaseError('장소 이력 배치 조회 실패', error)
      throw new Error(`장소 이력 조회에 실패했습니다: ${error.message}`)
    }
    return (data ?? []) as RestaurantRow[]
  }))

  const restaurants = results.flat().map((row) => toRestaurant(row, row.place_id ? locations.get(row.place_id) : undefined))
  const categoryCounts = new Map<string, number>()
  restaurants.forEach((restaurant) => {
    if (restaurant.category != null) {
      categoryCounts.set(restaurant.category, (categoryCounts.get(restaurant.category) ?? 0) + 1)
    }
  })
  console.table(
    [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([category, count]) => ({ category, count })),
  )
  return restaurants
}
