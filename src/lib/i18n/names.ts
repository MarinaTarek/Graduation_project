export interface LocalizedEntity {
  name: string
  name_ar?: string
}

export function localizedName(entity?: LocalizedEntity | null, lang: 'en' | 'ar' = 'en'): string {
  if (!entity) return ''
  if (lang === 'ar' && entity.name_ar) {
    return entity.name_ar
  }
  return entity.name
}
