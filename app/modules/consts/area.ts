import { AreaType } from '../enums/AreaType'
import { CityNameType } from '../enums/CityNameType'

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

export const areaMapAreaName: Record<AreaType, string> = {
    [AreaType.TAIPEI]: '台北',
    [AreaType.TAOYUAN]: '桃園',
    [AreaType.TAICHUNG]: '台中',
    [AreaType.TAINAN]: '台南',
    [AreaType.KAOHSIUNG]: '高雄',
    [AreaType.KEELUNG]: '基隆',
    [AreaType.HSINCHU]: '新竹',
    [AreaType.MIAOLI]: '苗栗',
    [AreaType.CHANGHUA]: '彰化',
    [AreaType.NANTOU]: '南投',
    [AreaType.YUNLIN]: '雲林',
    [AreaType.CHIAYI]: '嘉義',
    [AreaType.PINGTUNG]: '屏東',
    [AreaType.YILAN]: '宜蘭',
    [AreaType.HUALIEN]: '花蓮',
    [AreaType.TAITUNG]: '台東',
    [AreaType.KINMEN]: '金門',
    [AreaType.PENGHU]: '澎湖',
    [AreaType.LIENCHIANG]: '連江'
}
