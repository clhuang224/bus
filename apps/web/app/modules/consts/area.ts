import { AreaType, CITIES_BY_AREA, CityNameType } from '@bus/shared'

type ZhTWLocale = typeof import('../i18n/locales/zh-TW').zhTW
type AreaTranslationKey =
  `common.area.${keyof ZhTWLocale['translation']['common']['area']}`

export const areaMapCity = CITIES_BY_AREA

export const areaTranslationKeyMap: Record<AreaType, AreaTranslationKey> = {
  [AreaType.TAIPEI]: 'common.area.Taipei',
  [AreaType.TAOYUAN]: 'common.area.Taoyuan',
  [AreaType.TAICHUNG]: 'common.area.Taichung',
  [AreaType.TAINAN]: 'common.area.Tainan',
  [AreaType.KAOHSIUNG]: 'common.area.Kaohsiung',
  [AreaType.KEELUNG]: 'common.area.Keelung',
  [AreaType.HSINCHU]: 'common.area.Hsinchu',
  [AreaType.MIAOLI]: 'common.area.Miaoli',
  [AreaType.CHANGHUA]: 'common.area.Changhua',
  [AreaType.NANTOU]: 'common.area.Nantou',
  [AreaType.YUNLIN]: 'common.area.Yunlin',
  [AreaType.CHIAYI]: 'common.area.Chiayi',
  [AreaType.PINGTUNG]: 'common.area.Pingtung',
  [AreaType.YILAN]: 'common.area.Yilan',
  [AreaType.HUALIEN]: 'common.area.Hualien',
  [AreaType.TAITUNG]: 'common.area.Taitung',
  [AreaType.KINMEN]: 'common.area.Kinmen',
  [AreaType.PENGHU]: 'common.area.Penghu',
  [AreaType.LIENCHIANG]: 'common.area.Lienchiang',
}

export const cityMapArea = Object.entries(areaMapCity).reduce(
  (result, [area, cities]) => {
    cities.forEach((city) => {
      result[city] = area as AreaType
    })
    return result
  },
  {} as Record<CityNameType, AreaType>,
)
