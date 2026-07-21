import { supabase } from '../lib/supabase'
import type { Category, Restaurant, RestaurantRow, RestaurantStatus } from '../types/database'

export interface RestaurantQuery { search?: string; status?: 'all' | 'active' | 'closed'; category?: string; limit?: number }
export const restaurantColumns = 'restaurant_id, place_id, source_row_id, source_business_id, business_name, category, license_date, closure_date, status_raw, road_address_raw'

interface SupabaseError { message: string; details?: string; hint?: string; code?: string }

export function logSupabaseError(context: string, error: SupabaseError) {
  console.error(context, { message: error.message, details: error.details, hint: error.hint, code: error.code })
}

function normalizeStatus(row: RestaurantRow): RestaurantStatus {
  if (row.closure_date) return 'closed'
  const value = row.status_raw?.toLowerCase() ?? ''
  if (value.includes('폐업') || value.includes('closed')) return 'closed'
  if (value.includes('휴업') || value.includes('suspend')) return 'suspended'
  if (value.includes('영업') || value.includes('active') || value.includes('정상')) return 'active'
  return 'unknown'
}

function getOperatingYears(row: RestaurantRow): number | null {
  if (!row.license_date) return null
  const started = new Date(row.license_date)
  const ended = row.closure_date ? new Date(row.closure_date) : new Date()
  if (Number.isNaN(started.getTime()) || Number.isNaN(ended.getTime())) return null
  return Math.max(0, (ended.getTime() - started.getTime()) / (365.2425 * 24 * 60 * 60 * 1000))
}

export function toRestaurant(row: RestaurantRow, location?: { latitude: number | null; longitude: number | null }): Restaurant {
  const status = normalizeStatus(row)
  if (row.category == null) {
    console.warn('restaurants.category가 null입니다. 업종 집계에서 제외합니다.', {
      restaurant_id: row.restaurant_id,
      source_row_id: row.source_row_id,
      business_name: row.business_name,
    })
  }
  return {
    restaurant_id: row.restaurant_id, place_id: row.place_id, source_row_id: row.source_row_id,
    source_business_id: row.source_business_id, business_name: row.business_name,
    category: row.category, status, is_active: status === 'active' || (status === 'unknown' && !row.closure_date),
    license_date: row.license_date, closure_date: row.closure_date, operating_years: getOperatingYears(row),
    road_address: row.road_address_raw, lot_address: null, normalized_address: null, phone: null,
    latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
    coordinate_valid: location ? location.latitude != null && location.longitude != null : null,
    coordinate_in_gangnam: null,
  }
}

export async function getRestaurants({ search = '', status = 'all', category = '', limit = 100 }: RestaurantQuery = {}): Promise<Restaurant[]> {
  let query = supabase.from('restaurants').select(restaurantColumns).order('license_date', { ascending: true, nullsFirst: false }).limit(limit)
  const term = search.trim().replace(/[,%()]/g, '')
  if (term) query = query.or(`business_name.ilike.%${term}%,road_address_raw.ilike.%${term}%`)
  const { data, error } = await query
  if (error) { logSupabaseError('restaurants 조회 실패', error); throw new Error(`음식점 조회에 실패했습니다: ${error.message}`) }
  let restaurants = ((data ?? []) as RestaurantRow[]).map((row) => toRestaurant(row))
  if (status !== 'all') restaurants = restaurants.filter((row) => status === 'active' ? row.is_active : !row.is_active)
  if (category) restaurants = restaurants.filter((row) => row.category === category)
  return restaurants
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('category_name').order('category_name')
  if (error) { logSupabaseError('categories 조회 실패', error); throw new Error(`업종 조회에 실패했습니다: ${error.message}`) }
  return data ?? []
}

export async function getPlaceHistory(placeId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase.from('restaurants').select(restaurantColumns).eq('place_id', placeId).order('license_date', { ascending: true, nullsFirst: false })
  if (error) { logSupabaseError('장소 이력 조회 실패', error); throw new Error(`장소 이력 조회에 실패했습니다: ${error.message}`) }
  return ((data ?? []) as RestaurantRow[]).map((row) => toRestaurant(row))
}
