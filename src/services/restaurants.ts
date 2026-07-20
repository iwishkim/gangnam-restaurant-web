import { supabase } from '../lib/supabase'
import type { Category, Restaurant } from '../types/database'

export interface RestaurantQuery { search?: string; status?: 'all' | 'active' | 'closed'; category?: string; limit?: number }
const columns = 'restaurant_id, place_id, source_row_id, business_name, category, status, is_active, license_date, closure_date, operating_years, road_address, lot_address, normalized_address, phone, latitude, longitude, coordinate_valid, coordinate_in_gangnam'

export async function getRestaurants({ search = '', status = 'all', category = '', limit = 100 }: RestaurantQuery = {}): Promise<Restaurant[]> {
  let query = supabase.from('restaurants').select(columns).not('latitude', 'is', null).not('longitude', 'is', null).order('operating_years', { ascending: false, nullsFirst: false }).order('license_date', { ascending: true, nullsFirst: false }).limit(limit)
  const term = search.trim().replace(/[,%()]/g, '')
  if (term) query = query.or(`business_name.ilike.%${term}%,road_address.ilike.%${term}%,lot_address.ilike.%${term}%,normalized_address.ilike.%${term}%`)
  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'closed') query = query.eq('is_active', false)
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw new Error(`음식점 조회에 실패했습니다: ${error.message}`)
  return data ?? []
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('category_name').order('category_name')
  if (error) throw new Error(`업종 조회에 실패했습니다: ${error.message}`)
  return data ?? []
}

export async function getPlaceHistory(placeId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase.from('restaurants').select(columns).eq('place_id', placeId).order('license_date', { ascending: true, nullsFirst: false })
  if (error) throw new Error(`장소 이력 조회에 실패했습니다: ${error.message}`)
  return data ?? []
}
