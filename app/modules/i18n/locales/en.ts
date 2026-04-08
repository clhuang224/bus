export const en = {
  translation: {
    app: {
      name: 'Finding the Bus',
      description: 'Find the bus you need, faster.'
    },
    common: {
      modal: {
        confirm: 'Confirm',
        cancel: 'Cancel',
        refresh: 'Refresh page'
      },
      area: {
        Taipei: 'Taipei Area',
        Taoyuan: 'Taoyuan',
        Taichung: 'Taichung',
        Tainan: 'Tainan',
        Kaohsiung: 'Kaohsiung',
        Keelung: 'Keelung',
        Hsinchu: 'Hsinchu',
        Miaoli: 'Miaoli',
        Changhua: 'Changhua',
        Nantou: 'Nantou',
        Yunlin: 'Yunlin',
        Chiayi: 'Chiayi',
        Pingtung: 'Pingtung',
        Yilan: 'Yilan',
        Hualien: 'Hualien',
        Taitung: 'Taitung',
        Kinmen: 'Kinmen',
        Penghu: 'Penghu',
        Lienchiang: 'Lienchiang'
      },
      city: {
        Taipei: 'Taipei City',
        NewTaipei: 'New Taipei City',
        Taoyuan: 'Taoyuan City',
        Taichung: 'Taichung City',
        Tainan: 'Tainan City',
        Kaohsiung: 'Kaohsiung City',
        Keelung: 'Keelung City',
        Hsinchu: 'Hsinchu City',
        HsinchuCounty: 'Hsinchu County',
        MiaoliCounty: 'Miaoli County',
        ChanghuaCounty: 'Changhua County',
        NantouCounty: 'Nantou County',
        YunlinCounty: 'Yunlin County',
        ChiayiCounty: 'Chiayi County',
        Chiayi: 'Chiayi City',
        PingtungCounty: 'Pingtung County',
        YilanCounty: 'Yilan County',
        HualienCounty: 'Hualien County',
        TaitungCounty: 'Taitung County',
        KinmenCounty: 'Kinmen County',
        PenghuCounty: 'Penghu County',
        LienchiangCounty: 'Lienchiang County'
      },
      direction: {
        go: 'Outbound',
        return: 'Inbound',
        loop: 'Loop',
        shuttle: 'Shuttle',
        unknown: 'Unknown'
      }
    },
    layout: {
      nav: {
        favorite: 'Favorites',
        nearby: 'Nearby',
        routes: 'Routes',
        settings: 'Settings'
      }
    },
    pages: {
      favorite: {
        title: 'Favorites'
      },
      routes: {
        title: 'Routes'
      },
      settings: {
        title: 'Settings',
        backAriaLabel: 'Back',
        languageSectionTitle: 'Language',
        localeOptions: {
          zhTW: {
            label: 'Traditional Chinese'
          },
          en: {
            label: 'English'
          }
        }
      }
    },
    components: {
      searchInput: {
        ariaLabel: 'Search bus routes',
        placeholder: 'Search routes or stops',
        clearAriaLabel: 'Clear search keyword'
      },
      areaSelect: {
        ariaLabel: 'Choose area'
      },
      favoriteRouteStopCard: {
        removeAriaLabel: 'Remove favorite route stop',
        terminalLabel: 'Terminals',
        departureLabel: 'Origin',
        destinationLabel: 'Destination',
        terminal: '{{departure}} → {{destination}}'
      },
      routeInfoCard: {
        terminalLabel: 'Terminals',
        departureLabel: 'Origin',
        destinationLabel: 'Destination',
        terminal: 'Terminals: {{departure}} → {{destination}}'
      },
      routeStopList: {
        addFavoriteAriaLabel: 'Save route stop',
        removeFavoriteAriaLabel: 'Remove saved route stop'
      },
      routeMap: {
        stopMarkerAriaLabel: '{{stopName}}, stop {{sequence}}',
        vehicleMarkerAriaLabel: '{{plateNumb}}, recent stop {{stopName}}, estimated arrival {{estimateLabel}}',
        vehiclePopup: {
          recentStop: 'Recent stop',
          recentStopUnknown: 'Unknown',
          estimate: 'Estimated arrival'
        }
      },
      baseMap: {
        userLocationMarkerAriaLabel: 'Current location'
      },
      mapSidebarLayout: {
        openNearbyStops: 'Open nearby stops list',
        openRouteList: 'Open route list'
      },
      nearbyStopDetail: {
        cityLabel: 'City',
        addressLabel: 'Address',
        routesLabel: 'Routes',
        notProvided: 'Not provided',
        viewRoutesAriaLabel: 'View routes for {{stopName}}'
      },
      nearbyStopRoutes: {
        title: 'Routes at this stop',
        empty: 'No route information is currently available for this stop'
      },
      nearbyStopMap: {
        stopMarkerAriaLabel: 'Nearby stop {{stopName}}'
      },
      nearbySidebarContent: {
        backAriaLabel: 'Back to nearby stops list'
      }
    },
    routePage: {
      backToRoutes: 'Back to routes',
      realtime: {
        inService: 'In service',
        comingSoon: 'Coming soon',
        noEstimate: 'No estimate available',
        minutesAway_one: 'Arriving in {{count}} min',
        minutesAway_other: 'Arriving in {{count}} mins',
        stopStatus: {
          normal: 'Normal',
          notYetDeparted: 'Not departed yet',
          noStopDueToTrafficControl: 'Skipping stop due to traffic control',
          lastBusPassed: 'Last bus has passed',
          notInServiceToday: 'Not in service today',
          unknown: 'Unknown status'
        }
      }
    },
    errorBoundary: {
      default: {
        title: 'Error'
      },
      notFound: {
        title: '404',
        description: 'The requested page could not be found.'
      }
    },
    messages: {
      nearby: {
        loadStopsError: {
          title: 'Unable to load stops',
          description: 'Please try again later or check your internet connection.'
        },
        emptyStops: {
          title: 'No nearby stops',
          description: 'There are no bus stops near your current location right now.'
        }
      },
      favorite: {
        emptyFavoriteRouteStops: {
          title: 'No favorite route stops yet',
          description: 'Use the heart button in a route stop list to save a stop from a subroute to your favorites.'
        }
      },
      search: {
        loadRoutesError: {
          title: 'Unable to load routes',
          description: 'Please try again later or check your internet connection.'
        },
        emptyRoutes: {
          title: 'No matching routes',
          description: 'Try another keyword or switch to a different area.'
        }
      },
      route: {
        loadRouteError: {
          title: 'Unable to load route',
          description: 'Please try again later or check your internet connection.'
        },
        emptyRoute: {
          title: 'Route not found',
          description: 'We could not find data for this bus route.'
        }
      },
      routeRealtime: {
        loading: {
          title: 'Updating',
          description: 'Refreshing realtime bus data...'
        },
        error: {
          title: 'Realtime bus',
          description: 'Realtime bus data is temporarily incomplete.'
        },
        rateLimited: {
          title: 'Realtime bus',
          description: 'Too many people are querying right now. Realtime bus data will retry shortly.'
        },
        noService: {
          title: 'Service status',
          description: 'There are no active services right now'
        },
        noRealtimeData: {
          title: 'Realtime bus',
          description: 'No realtime bus information is available right now. Service may have ended or upstream data may be temporarily incomplete.'
        }
      },
      busService: {
        unauthorized: {
          title: 'Bus data service authentication failed',
          description: 'The app could not authenticate with the bus data service right now. Please try again later.'
        },
        rateLimited: {
          title: 'Too many queries right now',
          description: 'The system cannot fetch bus data at the moment. Please wait a bit and try again.'
        },
        systemError: {
          title: 'The system is temporarily unavailable',
          description: 'Bus data is temporarily unavailable. Please try again later.'
        }
      },
      geo: {
        permission: {
          unsupported: {
            title: 'Nearby stops unavailable',
            description: 'Your browser does not support geolocation, so nearby stops cannot be used.'
          },
          denied: {
            title: 'Nearby stops unavailable',
            description: 'Nearby stops need location access. Please allow this site to use your location in browser settings.'
          }
        },
        error: {
          permissionDenied: {
            title: 'Unable to get location',
            description: 'Please allow this site to use your location in browser settings.'
          },
          positionUnavailable: {
            title: 'Location failed',
            description: 'We could not get your location right now, so nearby stops are temporarily unavailable. Please try again later and check your device location service and network connection.'
          },
          timeout: {
            title: 'Location timed out',
            description: 'Getting your location timed out, so nearby stops are temporarily unavailable. Please try again later and check your device location service and network connection.'
          }
        }
      }
    }
  }
} as const
