export type RestaurantStatus =
  | 'active'
  | 'closed'
  | 'suspended'
  | 'unknown'

export interface RestaurantRow {
  restaurant_id: string
  place_id: string | null
  source_row_id: number
  source_business_id: string | null
  business_name: string | null
  category: string | null
  license_date: string | null
  closure_date: string | null
  status_raw: string | null
  road_address_raw: string | null
}

export interface Restaurant {
  restaurant_id: string
  place_id: string | null
  source_row_id: number
  source_business_id: string | null
  business_name: string | null
  category: string | null
  status: RestaurantStatus | null
  is_active: boolean
  license_date: string | null
  closure_date: string | null
  operating_years: number | null
  road_address: string | null
  lot_address: string | null
  normalized_address: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  coordinate_valid: boolean | null
  coordinate_in_gangnam: boolean | null
}

export interface Place {
  place_id: string
  place_key: string
  normalized_address: string | null
  road_address: string | null
  lot_address: string | null
  latitude: number | null
  longitude: number | null
  restaurant_count: number
  active_restaurant_count: number
  first_license_date: string | null
  last_license_date: string | null
  last_closure_date: string | null
  has_active_restaurant: boolean
  history_start_year: number | null
  history_end_year: number | null
}

export interface Category {
  category_name: string
}
