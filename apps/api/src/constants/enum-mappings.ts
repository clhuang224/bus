import {
  BearingType,
  CityNameType,
  DirectionType,
  SyncStatusType,
} from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  BearingType as PrismaBearingType,
  DirectionType as PrismaDirectionType,
  RouteShapeSource as PrismaRouteShapeSource,
  SyncStatusType as PrismaSyncStatusType,
} from '../generated/prisma/enums.js'

export const API_SYNC_STATUS_BY_PRISMA = {
  [PrismaSyncStatusType.QUEUED]: SyncStatusType.QUEUED,
  [PrismaSyncStatusType.RUNNING]: SyncStatusType.RUNNING,
  [PrismaSyncStatusType.PENDING]: SyncStatusType.PENDING,
  [PrismaSyncStatusType.SUCCEEDED]: SyncStatusType.SUCCEEDED,
  [PrismaSyncStatusType.FAILED]: SyncStatusType.FAILED,
} satisfies Record<PrismaSyncStatusType, SyncStatusType>

export const PRISMA_CITY_BY_TDX_CITY = {
  [CityNameType.TAIPEI]: PrismaCityNameType.TAIPEI,
  [CityNameType.NEW_TAIPEI]: PrismaCityNameType.NEW_TAIPEI,
  [CityNameType.TAOYUAN]: PrismaCityNameType.TAOYUAN,
  [CityNameType.TAICHUNG]: PrismaCityNameType.TAICHUNG,
  [CityNameType.TAINAN]: PrismaCityNameType.TAINAN,
  [CityNameType.KAOHSIUNG]: PrismaCityNameType.KAOHSIUNG,
  [CityNameType.KEELUNG]: PrismaCityNameType.KEELUNG,
  [CityNameType.HSINCHU]: PrismaCityNameType.HSINCHU,
  [CityNameType.HSINCHU_COUNTY]: PrismaCityNameType.HSINCHU_COUNTY,
  [CityNameType.MIAOLI_COUNTY]: PrismaCityNameType.MIAOLI_COUNTY,
  [CityNameType.CHANGHUA_COUNTY]: PrismaCityNameType.CHANGHUA_COUNTY,
  [CityNameType.NANTOU_COUNTY]: PrismaCityNameType.NANTOU_COUNTY,
  [CityNameType.YUNLIN_COUNTY]: PrismaCityNameType.YUNLIN_COUNTY,
  [CityNameType.CHIAYI_COUNTY]: PrismaCityNameType.CHIAYI_COUNTY,
  [CityNameType.CHIAYI]: PrismaCityNameType.CHIAYI,
  [CityNameType.PINGTUNG_COUNTY]: PrismaCityNameType.PINGTUNG_COUNTY,
  [CityNameType.YILAN_COUNTY]: PrismaCityNameType.YILAN_COUNTY,
  [CityNameType.HUALIEN_COUNTY]: PrismaCityNameType.HUALIEN_COUNTY,
  [CityNameType.TAITUNG_COUNTY]: PrismaCityNameType.TAITUNG_COUNTY,
  [CityNameType.KINMEN_COUNTY]: PrismaCityNameType.KINMEN_COUNTY,
  [CityNameType.PENGHU_COUNTY]: PrismaCityNameType.PENGHU_COUNTY,
  [CityNameType.LIENCHIANG_COUNTY]: PrismaCityNameType.LIENCHIANG_COUNTY,
} satisfies Record<CityNameType, PrismaCityNameType>

export const PRISMA_DIRECTION_BY_TDX_DIRECTION = {
  [DirectionType.GO]: PrismaDirectionType.GO,
  [DirectionType.RETURN]: PrismaDirectionType.RETURN,
  [DirectionType.LOOP]: PrismaDirectionType.LOOP,
  [DirectionType.SHUTTLE]: PrismaDirectionType.SHUTTLE,
  [DirectionType.UNKNOWN]: PrismaDirectionType.UNKNOWN,
} satisfies Record<DirectionType, PrismaDirectionType>

export const PRISMA_BEARING_BY_TDX_BEARING = {
  [BearingType.EAST]: PrismaBearingType.EAST,
  [BearingType.WEST]: PrismaBearingType.WEST,
  [BearingType.SOUTH]: PrismaBearingType.SOUTH,
  [BearingType.NORTH]: PrismaBearingType.NORTH,
  [BearingType.SOUTHEAST]: PrismaBearingType.SOUTHEAST,
  [BearingType.NORTHEAST]: PrismaBearingType.NORTHEAST,
  [BearingType.SOUTHWEST]: PrismaBearingType.SOUTHWEST,
  [BearingType.NORTHWEST]: PrismaBearingType.NORTHWEST,
} satisfies Record<BearingType, PrismaBearingType>

export const DB_CITY_NAME_BY_PRISMA = {
  [PrismaCityNameType.TAIPEI]: 'Taipei',
  [PrismaCityNameType.NEW_TAIPEI]: 'NewTaipei',
  [PrismaCityNameType.TAOYUAN]: 'Taoyuan',
  [PrismaCityNameType.TAICHUNG]: 'Taichung',
  [PrismaCityNameType.TAINAN]: 'Tainan',
  [PrismaCityNameType.KAOHSIUNG]: 'Kaohsiung',
  [PrismaCityNameType.KEELUNG]: 'Keelung',
  [PrismaCityNameType.HSINCHU]: 'Hsinchu',
  [PrismaCityNameType.HSINCHU_COUNTY]: 'HsinchuCounty',
  [PrismaCityNameType.MIAOLI_COUNTY]: 'MiaoliCounty',
  [PrismaCityNameType.CHANGHUA_COUNTY]: 'ChanghuaCounty',
  [PrismaCityNameType.NANTOU_COUNTY]: 'NantouCounty',
  [PrismaCityNameType.YUNLIN_COUNTY]: 'YunlinCounty',
  [PrismaCityNameType.CHIAYI_COUNTY]: 'ChiayiCounty',
  [PrismaCityNameType.CHIAYI]: 'Chiayi',
  [PrismaCityNameType.PINGTUNG_COUNTY]: 'PingtungCounty',
  [PrismaCityNameType.YILAN_COUNTY]: 'YilanCounty',
  [PrismaCityNameType.HUALIEN_COUNTY]: 'HualienCounty',
  [PrismaCityNameType.TAITUNG_COUNTY]: 'TaitungCounty',
  [PrismaCityNameType.KINMEN_COUNTY]: 'KinmenCounty',
  [PrismaCityNameType.PENGHU_COUNTY]: 'PenghuCounty',
  [PrismaCityNameType.LIENCHIANG_COUNTY]: 'LienchiangCounty',
} satisfies Record<PrismaCityNameType, string>

export const DB_BEARING_BY_PRISMA = {
  [PrismaBearingType.EAST]: 'east',
  [PrismaBearingType.WEST]: 'west',
  [PrismaBearingType.SOUTH]: 'south',
  [PrismaBearingType.NORTH]: 'north',
  [PrismaBearingType.SOUTHEAST]: 'southeast',
  [PrismaBearingType.NORTHEAST]: 'northeast',
  [PrismaBearingType.SOUTHWEST]: 'southwest',
  [PrismaBearingType.NORTHWEST]: 'northwest',
} satisfies Record<PrismaBearingType, string>

export const DB_ROUTE_SHAPE_SOURCE_BY_PRISMA = {
  [PrismaRouteShapeSource.ENCODED_POLYLINE]: 'encoded_polyline',
  [PrismaRouteShapeSource.GEOMETRY]: 'geometry',
  [PrismaRouteShapeSource.STOP_POSITIONS]: 'stop_positions',
} satisfies Record<PrismaRouteShapeSource, string>
