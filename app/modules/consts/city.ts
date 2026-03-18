import { CityNameType } from '../enums/CityNameType'
import { CountyIdType } from '../enums/CountyIdType'

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
