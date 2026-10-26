/**
 * Egypt Regions System
 * Source of truth for Egyptian governorates, cities, and sales territories.
 * Fully supports both English and Arabic modes with consistent identifiers.
 */

export interface EgyptRegion {
  id: string
  name_en: string
  name_ar: string
  governorate_en: string
  governorate_ar: string
  type: 'city' | 'governorate' | 'territory'
  salesTerritory?: 'North' | 'West' | 'Central' | 'East' | 'South' | 'Delta' | 'Upper Egypt'
}

export const EGYPT_REGIONS: EgyptRegion[] = [
  // Preserved legacy / standard territories
  {
    id: 'north-region',
    name_en: 'North region',
    name_ar: 'المنطقة الشمالية',
    governorate_en: 'Alexandria / Mediterranean Coast',
    governorate_ar: 'الإسكندرية والساحل الشمالي',
    type: 'territory',
    salesTerritory: 'North',
  },
  {
    id: 'west-region',
    name_en: 'West region',
    name_ar: 'المنطقة الغربية',
    governorate_en: 'Giza / Western Sector',
    governorate_ar: 'الجيزة والقطاع الغربي',
    type: 'territory',
    salesTerritory: 'West',
  },
  {
    id: 'central-region',
    name_en: 'Central region',
    name_ar: 'المنطقة الوسطى',
    governorate_en: 'Cairo Metropolitan',
    governorate_ar: 'القاهرة الكبرى',
    type: 'territory',
    salesTerritory: 'Central',
  },
  {
    id: 'east-region',
    name_en: 'East region',
    name_ar: 'المنطقة الشرقية',
    governorate_en: 'Canal Zone / East Delta',
    governorate_ar: 'مدن القناة وشرق الدلتا',
    type: 'territory',
    salesTerritory: 'East',
  },
  {
    id: 'south-region',
    name_en: 'South region',
    name_ar: 'المنطقة الجنوبية',
    governorate_en: 'Upper Egypt',
    governorate_ar: 'صعيد مصر',
    type: 'territory',
    salesTerritory: 'South',
  },

  // Explicitly Required Key Egyptian Cities & Governorates
  {
    id: 'tanta',
    name_en: 'Tanta',
    name_ar: 'طنطا',
    governorate_en: 'Gharbia Governorate',
    governorate_ar: 'محافظة الغربية',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'el-mahalla',
    name_en: 'El Mahalla El Kubra',
    name_ar: 'المحلة الكبرى',
    governorate_en: 'Gharbia Governorate',
    governorate_ar: 'محافظة الغربية',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'assiut',
    name_en: 'Assiut',
    name_ar: 'أسيوط',
    governorate_en: 'Assiut Governorate',
    governorate_ar: 'محافظة أسيوط',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },

  // Egyptian Governorates & Key Commercial Centers
  {
    id: 'cairo',
    name_en: 'Cairo',
    name_ar: 'القاهرة',
    governorate_en: 'Cairo Governorate',
    governorate_ar: 'محافظة القاهرة',
    type: 'governorate',
    salesTerritory: 'Central',
  },
  {
    id: 'giza',
    name_en: 'Giza',
    name_ar: 'الجيزة',
    governorate_en: 'Giza Governorate',
    governorate_ar: 'محافظة الجيزة',
    type: 'governorate',
    salesTerritory: 'West',
  },
  {
    id: 'alexandria',
    name_en: 'Alexandria',
    name_ar: 'الإسكندرية',
    governorate_en: 'Alexandria Governorate',
    governorate_ar: 'محافظة الإسكندرية',
    type: 'governorate',
    salesTerritory: 'North',
  },
  {
    id: 'gharbia',
    name_en: 'Gharbia',
    name_ar: 'الغربية',
    governorate_en: 'Gharbia Governorate',
    governorate_ar: 'محافظة الغربية',
    type: 'governorate',
    salesTerritory: 'Delta',
  },
  {
    id: 'dakahlia',
    name_en: 'Mansoura (Dakahlia)',
    name_ar: 'المنصورة (الدقهلية)',
    governorate_en: 'Dakahlia Governorate',
    governorate_ar: 'محافظة الدقهلية',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'sharqia',
    name_en: 'Zagazig (Sharqia)',
    name_ar: 'الزقازيق (الشرقية)',
    governorate_en: 'Sharqia Governorate',
    governorate_ar: 'محافظة الشرقية',
    type: 'city',
    salesTerritory: 'East',
  },
  {
    id: 'qalyubia',
    name_en: 'Banha (Qalyubia)',
    name_ar: 'بنها (القليوبية)',
    governorate_en: 'Qalyubia Governorate',
    governorate_ar: 'محافظة القليوبية',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'beheira',
    name_en: 'Damanhur (Beheira)',
    name_ar: 'دمنهور (البحيرة)',
    governorate_en: 'Beheira Governorate',
    governorate_ar: 'محافظة البحيرة',
    type: 'city',
    salesTerritory: 'North',
  },
  {
    id: 'menofia',
    name_en: 'Shibin El Kom (Menofia)',
    name_ar: 'شبين الكوم (المنوفية)',
    governorate_en: 'Menofia Governorate',
    governorate_ar: 'محافظة المنوفية',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'kafr-el-sheikh',
    name_en: 'Kafr El Sheikh',
    name_ar: 'كفر الشيخ',
    governorate_en: 'Kafr El Sheikh Governorate',
    governorate_ar: 'محافظة كفر الشيخ',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'damietta',
    name_en: 'Damietta',
    name_ar: 'دمياط',
    governorate_en: 'Damietta Governorate',
    governorate_ar: 'محافظة دمياط',
    type: 'city',
    salesTerritory: 'Delta',
  },
  {
    id: 'port-said',
    name_en: 'Port Said',
    name_ar: 'بورسعيد',
    governorate_en: 'Port Said Governorate',
    governorate_ar: 'محافظة بورسعيد',
    type: 'governorate',
    salesTerritory: 'East',
  },
  {
    id: 'ismailia',
    name_en: 'Ismailia',
    name_ar: 'الإسماعيلية',
    governorate_en: 'Ismailia Governorate',
    governorate_ar: 'محافظة الإسماعيلية',
    type: 'governorate',
    salesTerritory: 'East',
  },
  {
    id: 'suez',
    name_en: 'Suez',
    name_ar: 'السويس',
    governorate_en: 'Suez Governorate',
    governorate_ar: 'محافظة السويس',
    type: 'governorate',
    salesTerritory: 'East',
  },
  {
    id: 'fayoum',
    name_en: 'Fayoum',
    name_ar: 'الفيوم',
    governorate_en: 'Fayoum Governorate',
    governorate_ar: 'محافظة الفيوم',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'beni-suef',
    name_en: 'Beni Suef',
    name_ar: 'بني سويف',
    governorate_en: 'Beni Suef Governorate',
    governorate_ar: 'محافظة بني سويف',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'minya',
    name_en: 'Minya',
    name_ar: 'المنيا',
    governorate_en: 'Minya Governorate',
    governorate_ar: 'محافظة المنيا',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'sohag',
    name_en: 'Sohag',
    name_ar: 'سوهاج',
    governorate_en: 'Sohag Governorate',
    governorate_ar: 'محافظة سوهاج',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'qena',
    name_en: 'Qena',
    name_ar: 'قنا',
    governorate_en: 'Qena Governorate',
    governorate_ar: 'محافظة قنا',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'luxor',
    name_en: 'Luxor',
    name_ar: 'الأقصر',
    governorate_en: 'Luxor Governorate',
    governorate_ar: 'محافظة الأقصر',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'aswan',
    name_en: 'Aswan',
    name_ar: 'أسوان',
    governorate_en: 'Aswan Governorate',
    governorate_ar: 'محافظة أسوان',
    type: 'city',
    salesTerritory: 'Upper Egypt',
  },
  {
    id: 'red-sea',
    name_en: 'Hurghada (Red Sea)',
    name_ar: 'الغردقة (البحر الأحمر)',
    governorate_en: 'Red Sea Governorate',
    governorate_ar: 'محافظة البحر الأحمر',
    type: 'city',
    salesTerritory: 'East',
  },
  {
    id: 'south-sinai',
    name_en: 'Sharm El Sheikh (South Sinai)',
    name_ar: 'شرم الشيخ (جنوب سيناء)',
    governorate_en: 'South Sinai Governorate',
    governorate_ar: 'محافظة جنوب سيناء',
    type: 'city',
    salesTerritory: 'East',
  },
  {
    id: 'matrouh',
    name_en: 'Marsa Matrouh',
    name_ar: 'مرسى مطروح',
    governorate_en: 'Matrouh Governorate',
    governorate_ar: 'محافظة مطروح',
    type: 'city',
    salesTerritory: 'North',
  },
]

/**
 * Bi-directional lookup maps
 */
export const REGION_NAME_TO_AR: Record<string, string> = {
  'All regions': 'جميع المناطق',
  'All territories': 'جميع المناطق البيعية',
}

export const REGION_NAME_TO_EN: Record<string, string> = {
  'جميع المناطق': 'All regions',
  'جميع المناطق البيعية': 'All territories',
}

EGYPT_REGIONS.forEach((reg) => {
  REGION_NAME_TO_AR[reg.name_en] = reg.name_ar
  REGION_NAME_TO_AR[reg.id] = reg.name_ar
  REGION_NAME_TO_EN[reg.name_ar] = reg.name_en
  REGION_NAME_TO_EN[reg.id] = reg.name_en
})

// Support existing legacy district keys used in reports
const LEGACY_DISTRICT_MAP: Record<string, { en: string; ar: string }> = {
  'Central District': { en: 'Central District', ar: 'القطاع الأوسط (القاهرة الكبرى)' },
  'North District': { en: 'North District', ar: 'القطاع الشمالي (الإسكندرية والساحل)' },
  'West District': { en: 'West District', ar: 'القطاع الغربي (الجيزة والصحراوي)' },
  'East District': { en: 'East District', ar: 'القطاع الشرقي (القناة والبحر الأحمر)' },
  'South District': { en: 'South District', ar: 'القطاع الجنوبي (صعيد مصر)' },
  'Delta': { en: 'Delta', ar: 'الدلتا' },
  'Upper Egypt': { en: 'Upper Egypt', ar: 'صعيد مصر' },
  'Alex': { en: 'Alexandria', ar: 'الإسكندرية' },
}

Object.entries(LEGACY_DISTRICT_MAP).forEach(([key, val]) => {
  REGION_NAME_TO_AR[key] = val.ar
  REGION_NAME_TO_EN[val.ar] = val.en
})

/**
 * Helper to get localized region name safely
 */
export function getLocalizedRegionName(nameOrId: string, lang: 'en' | 'ar' = 'en'): string {
  if (!nameOrId) return ''
  if (lang === 'ar') {
    return REGION_NAME_TO_AR[nameOrId] || nameOrId
  }
  return REGION_NAME_TO_EN[nameOrId] || nameOrId
}
