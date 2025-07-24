export interface TdxBusSubRoute {
  SubRouteUID: string,
  SubRouteID: string,
  OperatorIDs: [
    string
  ],
  SubRouteName: {
    Zh_tw: string,
    En: string
  },
  Direction: 0,
  FirstBusTime: string,
  LastBusTime: string,
  HolidayFirstBusTime: string,
  HolidayLastBusTime: string,
  DepartureStopNameZh: string,
  DepartureStopNameEn: string,
  DestinationStopNameZh: string,
  DestinationStopNameEn: string
}

export interface TdxBusRoute {
  RouteUID: string,
  RouteID: string,
  HasSubRoutes: true,
  Operators: [
    {
      OperatorID: string,
      OperatorName: {
        Zh_tw: string,
        En: string
      },
      OperatorCode: string,
      OperatorNo: string
    }
  ],
  AuthorityID: string,
  ProviderID: string,
  SubRoutes: TdxBusSubRoute[],
  BusRouteType: 0,
  RouteName: {
    Zh_tw: string,
    En: string
  },
  DepartureStopNameZh: string,
  DepartureStopNameEn: string,
  DestinationStopNameZh: string,
  DestinationStopNameEn: string,
  TicketPriceDescriptionZh: string,
  TicketPriceDescriptionEn: string,
  FareBufferZoneDescriptionZh: string,
  FareBufferZoneDescriptionEn: string,
  RouteMapImageUrl: string,
  City: string,
  CityCode: string,
  UpdateTime: string,
  VersionID: 0
}
