export type TerminalDisplay =
  | {
      labelKey: 'terminalLabel'
      text: string
    }
  | {
      labelKey: 'departureLabel'
      text: string
    }
  | {
      labelKey: 'destinationLabel'
      text: string
    }
  | null

export function getTerminalDisplay(
  departure: string | null | undefined,
  destination: string | null | undefined,
  separator = ' → '
): TerminalDisplay {
  if (departure && destination) {
    return {
      labelKey: 'terminalLabel',
      text: `${departure}${separator}${destination}`
    }
  }

  if (departure) {
    return {
      labelKey: 'departureLabel',
      text: departure
    }
  }

  if (destination) {
    return {
      labelKey: 'destinationLabel',
      text: destination
    }
  }

  return null
}
