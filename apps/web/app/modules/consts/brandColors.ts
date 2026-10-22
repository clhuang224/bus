/**
 * The five brand colors. Cool colors mark a route's structure; warm colors
 * mark what moves or needs attention. Mantine palettes in ThemeProvider are
 * built from the same values.
 */
export const BRAND_COLORS = {
  /** Text, headings, route lines, and the mobile banner. */
  ink: '#086788',
  /** Primary actions, active navigation, route badges, and stop outlines. */
  primary: '#07a0c3',
  /** Vehicles and realtime cues, with ink text. */
  sun: '#f0c808',
  /** Page background and city badges, as tints. */
  cream: '#fff1d0',
  /** Highlighted stops, favorites, and errors. */
  cherry: '#dd1c1a',
} as const
