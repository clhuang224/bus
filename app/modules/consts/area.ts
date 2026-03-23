import { AreaType } from '../enums/AreaType'
import { CityNameType } from '../enums/CityNameType'
import type { zhTW } from '../i18n/locales/zh-TW'

type AreaTranslationKey = `common.area.${keyof typeof zhTW.translation.common.area}`

export const areaMapCity: Record<AreaType, CityNameType[]> = {
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
    [AreaType.LIENCHIANG]: [CityNameType.LIENCHIANG_COUNTY]
}

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
    [AreaType.LIENCHIANG]: 'common.area.Lienchiang'
}

export const cityMapArea = Object.entries(areaMapCity).reduce((result, [area, cities]) => {
    cities.forEach((city) => {
        result[city] = area as AreaType
    })
    return result
}, {} as Record<CityNameType, AreaType>)
