import { AreaType, CityNameType } from '../enums/index.js'

export const CITIES_BY_AREA: Record<AreaType, CityNameType[]> = {
  [AreaType.TAIPEI]: [CityNameType.TAIPEI, CityNameType.NEW_TAIPEI],
  [AreaType.TAOYUAN]: [CityNameType.TAOYUAN],
  [AreaType.TAICHUNG]: [CityNameType.TAICHUNG],
  [AreaType.TAINAN]: [CityNameType.TAINAN],
  [AreaType.KAOHSIUNG]: [CityNameType.KAOHSIUNG],
  [AreaType.KEELUNG]: [CityNameType.KEELUNG],
  [AreaType.HSINCHU]: [CityNameType.HSINCHU, CityNameType.HSINCHU_COUNTY],
  [AreaType.MIAOLI]: [CityNameType.MIAOLI_COUNTY],
  [AreaType.CHANGHUA]: [CityNameType.CHANGHUA_COUNTY],
  [AreaType.NANTOU]: [CityNameType.NANTOU_COUNTY],
  [AreaType.YUNLIN]: [CityNameType.YUNLIN_COUNTY],
  [AreaType.CHIAYI]: [CityNameType.CHIAYI, CityNameType.CHIAYI_COUNTY],
  [AreaType.PINGTUNG]: [CityNameType.PINGTUNG_COUNTY],
  [AreaType.YILAN]: [CityNameType.YILAN_COUNTY],
  [AreaType.HUALIEN]: [CityNameType.HUALIEN_COUNTY],
  [AreaType.TAITUNG]: [CityNameType.TAITUNG_COUNTY],
  [AreaType.KINMEN]: [CityNameType.KINMEN_COUNTY],
  [AreaType.PENGHU]: [CityNameType.PENGHU_COUNTY],
  [AreaType.LIENCHIANG]: [CityNameType.LIENCHIANG_COUNTY],
}
