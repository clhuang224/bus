import { CityNameType } from '../enums/CityNameType'
import { CountyIdType } from '../enums/CountyIdType'
import type { zhTW } from '../i18n/locales/zh-TW'

type CityTranslationKey = `common.city.${keyof typeof zhTW.translation.common.city}`

export const cityMapName: Record<CityNameType, string> = {
  [CityNameType.TAIPEI]: '台北市',
  [CityNameType.NEW_TAIPEI]: '新北市',
  [CityNameType.TAOYUAN]: '桃園市',
  [CityNameType.TAICHUNG]: '台中市',
  [CityNameType.TAINAN]: '台南市',
  [CityNameType.KAOHSIUNG]: '高雄市',
  [CityNameType.KEELUNG]: '基隆市',
  [CityNameType.HSINCHU]: '新竹市',
  [CityNameType.HSINCHU_COUNTY]: '新竹縣',
  [CityNameType.MIAOLI_COUNTY]: '苗栗縣',
  [CityNameType.CHANGHUA_COUNTY]: '彰化縣',
  [CityNameType.NANTOU_COUNTY]: '南投縣',
  [CityNameType.YUNLIN_COUNTY]: '雲林縣',
  [CityNameType.CHIAYI_COUNTY]: '嘉義縣',
  [CityNameType.CHIAYI]: '嘉義市',
  [CityNameType.PINGTUNG_COUNTY]: '屏東縣',
  [CityNameType.YILAN_COUNTY]: '宜蘭縣',
  [CityNameType.HUALIEN_COUNTY]: '花蓮縣',
  [CityNameType.TAITUNG_COUNTY]: '台東縣',
  [CityNameType.KINMEN_COUNTY]: '金門縣',
  [CityNameType.PENGHU_COUNTY]: '澎湖縣',
  [CityNameType.LIENCHIANG_COUNTY]: '連江縣'
}

export const cityTranslationKeyMap: Record<CityNameType, CityTranslationKey> = {
  [CityNameType.TAIPEI]: 'common.city.Taipei',
  [CityNameType.NEW_TAIPEI]: 'common.city.NewTaipei',
  [CityNameType.TAOYUAN]: 'common.city.Taoyuan',
  [CityNameType.TAICHUNG]: 'common.city.Taichung',
  [CityNameType.TAINAN]: 'common.city.Tainan',
  [CityNameType.KAOHSIUNG]: 'common.city.Kaohsiung',
  [CityNameType.KEELUNG]: 'common.city.Keelung',
  [CityNameType.HSINCHU]: 'common.city.Hsinchu',
  [CityNameType.HSINCHU_COUNTY]: 'common.city.HsinchuCounty',
  [CityNameType.MIAOLI_COUNTY]: 'common.city.MiaoliCounty',
  [CityNameType.CHANGHUA_COUNTY]: 'common.city.ChanghuaCounty',
  [CityNameType.NANTOU_COUNTY]: 'common.city.NantouCounty',
  [CityNameType.YUNLIN_COUNTY]: 'common.city.YunlinCounty',
  [CityNameType.CHIAYI_COUNTY]: 'common.city.ChiayiCounty',
  [CityNameType.CHIAYI]: 'common.city.Chiayi',
  [CityNameType.PINGTUNG_COUNTY]: 'common.city.PingtungCounty',
  [CityNameType.YILAN_COUNTY]: 'common.city.YilanCounty',
  [CityNameType.HUALIEN_COUNTY]: 'common.city.HualienCounty',
  [CityNameType.TAITUNG_COUNTY]: 'common.city.TaitungCounty',
  [CityNameType.KINMEN_COUNTY]: 'common.city.KinmenCounty',
  [CityNameType.PENGHU_COUNTY]: 'common.city.PenghuCounty',
  [CityNameType.LIENCHIANG_COUNTY]: 'common.city.LienchiangCounty'
}

export const cityMapNameToCity = Object.fromEntries(
  Object.entries(cityMapName).map(([city, cityNameTw]) => [cityNameTw, city as CityNameType])
) as Record<string, CityNameType>

export const countyIdMapCity: Record<CountyIdType, CityNameType> = {
  [CountyIdType.TAIPEI]: CityNameType.TAIPEI,
  [CountyIdType.TAICHUNG]: CityNameType.TAICHUNG,
  [CountyIdType.KEELUNG]: CityNameType.KEELUNG,
  [CountyIdType.TAINAN]: CityNameType.TAINAN,
  [CountyIdType.KAOHSIUNG]: CityNameType.KAOHSIUNG,
  [CountyIdType.NEW_TAIPEI]: CityNameType.NEW_TAIPEI,
  [CountyIdType.YILAN_COUNTY]: CityNameType.YILAN_COUNTY,
  [CountyIdType.TAOYUAN]: CityNameType.TAOYUAN,
  [CountyIdType.CHIAYI]: CityNameType.CHIAYI,
  [CountyIdType.HSINCHU_COUNTY]: CityNameType.HSINCHU_COUNTY,
  [CountyIdType.MIAOLI_COUNTY]: CityNameType.MIAOLI_COUNTY,
  [CountyIdType.NANTOU_COUNTY]: CityNameType.NANTOU_COUNTY,
  [CountyIdType.CHANGHUA_COUNTY]: CityNameType.CHANGHUA_COUNTY,
  [CountyIdType.HSINCHU]: CityNameType.HSINCHU,
  [CountyIdType.YUNLIN_COUNTY]: CityNameType.YUNLIN_COUNTY,
  [CountyIdType.CHIAYI_COUNTY]: CityNameType.CHIAYI_COUNTY,
  [CountyIdType.PINGTUNG_COUNTY]: CityNameType.PINGTUNG_COUNTY,
  [CountyIdType.HUALIEN_COUNTY]: CityNameType.HUALIEN_COUNTY,
  [CountyIdType.TAITUNG_COUNTY]: CityNameType.TAITUNG_COUNTY,
  [CountyIdType.KINMEN_COUNTY]: CityNameType.KINMEN_COUNTY,
  [CountyIdType.PENGHU_COUNTY]: CityNameType.PENGHU_COUNTY,
  [CountyIdType.LIENCHIANG_COUNTY]: CityNameType.LIENCHIANG_COUNTY
}
