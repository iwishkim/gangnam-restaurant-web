import { useEffect, useState } from 'react'
import { getCategories, getRestaurants, type RestaurantQuery } from '../services/restaurants'
import type { Restaurant } from '../types/database'

export function useRestaurants(query: RestaurantQuery) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => { if (active) { setLoading(true); setError('') } })
    void Promise.all([getRestaurants(query), getCategories()])
      .then(([items, rows]) => {
        if (active) { setRestaurants(items); setCategories(rows.map((row) => row.category_name)) }
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : '데이터를 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [query])
  return { restaurants, categories, loading, error }
}
