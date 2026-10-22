import {
  Card,
  createTheme,
  defaultVariantColorsResolver,
  MantineProvider,
  parseThemeColor,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type VariantColorsResolver,
} from '@mantine/core'

// Each palette keeps the hue of one brand color and steps through lightness.
// Brand: #07a0c3 (6) and #086788 (8). Sun: #f0c808 (6). Cherry: #dd1c1a (6).
// Cream: #fff1d0 (2). Gray is a low-saturation tint of the brand hue.
const brand: MantineColorsTuple = [
  '#ecfafe',
  '#cff3fc',
  '#9ee6fa',
  '#64d7f7',
  '#2ac8f4',
  '#0cb5e4',
  '#07a0c3',
  '#0983a5',
  '#086788',
  '#055166',
]
const sun: MantineColorsTuple = [
  '#fefbec',
  '#fcf5cf',
  '#fcec9c',
  '#fae26b',
  '#f9db43',
  '#f8d420',
  '#f0c808',
  '#d0ae06',
  '#a88d05',
  '#816c04',
]
const cherry: MantineColorsTuple = [
  '#fdeded',
  '#fad7d6',
  '#f5aead',
  '#f0817f',
  '#eb5956',
  '#e73532',
  '#dd1c1a',
  '#bb1916',
  '#9b1412',
  '#7b100e',
]
const cream: MantineColorsTuple = [
  '#fefcf5',
  '#fef7e7',
  '#fff1d0',
  '#fbe7b6',
  '#ffda85',
  '#ffcb52',
  '#ffbc1f',
  '#e6a100',
  '#b27d00',
  '#805900',
]
const gray: MantineColorsTuple = [
  '#f9fafb',
  '#f3f6f7',
  '#e5eaeb',
  '#d4dbdd',
  '#b3bec1',
  '#8b989c',
  '#65767b',
  '#4b5d63',
  '#324348',
  '#1e2a2f',
]

const FONT_FAMILY =
  "Huninn, system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif"

// Yellow is too light for text on its own light tint, so its light
// variant uses the darkest shade for text instead.
const LIGHT_TEXT_COLORS = new Set(['sun'])

const variantColorResolver: VariantColorsResolver = (input) => {
  const colors = defaultVariantColorsResolver(input)
  const { color } = parseThemeColor({
    color: input.color ?? input.theme.primaryColor,
    theme: input.theme,
  })

  // A translucent cream tint looks dull, so cream badges use a solid shade.
  if (input.variant === 'light' && color === 'cream') {
    return {
      ...colors,
      background: 'var(--mantine-color-cream-3)',
      hover: 'var(--mantine-color-cream-4)',
      color: 'var(--mantine-color-cream-9)',
      hoverColor: 'var(--mantine-color-cream-9)',
    }
  }

  if (input.variant === 'light' && LIGHT_TEXT_COLORS.has(color)) {
    return {
      ...colors,
      color: `var(--mantine-color-${color}-9)`,
      hoverColor: `var(--mantine-color-${color}-9)`,
    }
  }

  return colors
}

const theme = createTheme({
  fontFamily: FONT_FAMILY,
  // Huninn has a single weight, so headings stand out by size and color.
  headings: { fontFamily: FONT_FAMILY, fontWeight: '400' },
  colors: { brand, sun, cherry, cream, gray },
  primaryColor: 'brand',
  primaryShade: 6,
  black: gray[9],
  defaultRadius: 'md',
  autoContrast: true,
  variantColorResolver,
  components: {
    Card: Card.extend({ defaultProps: { radius: 'lg' } }),
  },
})

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  // The palette's own cream, not a paler tint, which reads as off-white.
  light: { '--mantine-color-body': cream[2] },
  dark: {},
})

interface PropType {
  children: React.ReactElement
}

export const ThemeProvider = ({
  children,
}: PropType): React.ReactElement<PropType> => {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      {children}
    </MantineProvider>
  )
}
