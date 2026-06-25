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
