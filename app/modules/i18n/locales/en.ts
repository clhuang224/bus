export const en = {
  translation: {
    app: {
      name: 'Finding the Bus',
      description: 'Find the bus you need, faster.'
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
        placeholder: 'Search by route, departure stop, or destination'
      },
      favoriteRouteStopCard: {
        removeAriaLabel: 'Remove favorite route stop',
        terminalLabel: 'Terminals',
        terminal: '{{departure}} → {{destination}}'
      },
      routeStopList: {
        addFavoriteAriaLabel: 'Save route stop',
        removeFavoriteAriaLabel: 'Remove saved route stop',
        missingPlate: 'Plate unavailable'
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
      nearbySidebarContent: {
        backAriaLabel: 'Back to nearby stops list'
      }
    },
    routePage: {
      backToRoutes: 'Back to routes'
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
