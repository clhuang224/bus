import {
  Card,
  createTheme,
  MantineProvider,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core'

const blue: MantineColorsTuple = [
  '#eff6ff',
  '#d9e9ff',
  '#b3d4ff',
  '#89bafc',
  '#58a0fc',
  '#2a78d6',
  '#2372cf',
  '#035eb9',
  '#024b96',
  '#033974',
]
const orange: MantineColorsTuple = [
  '#fff2ee',
  '#ffe0d6',
  '#ffc0aa',
  '#fd9a76',
  '#f5713e',
  '#eb6834',
  '#bf460d',
  '#a33903',
  '#842c02',
  '#652103',
]
const teal: MantineColorsTuple = [
  '#e1fdee',
  '#c3f6db',
  '#8ee7bc',
  '#50d39c',
  '#2db983',
  '#1baf7a',
  '#03885d',
  '#0d724e',
  '#085c3e',
  '#01462e',
]
const yellow: MantineColorsTuple = [
  '#fff4e2',
  '#fee4bb',
  '#fdc76e',
  '#fab219',
  '#cd9216',
  '#af7b08',
  '#976902',
  '#7e580a',
  '#664606',
  '#4f3501',
]
const red: MantineColorsTuple = [
  '#fff2f0',
  '#ffe0dc',
  '#ffbeb8',
  '#fd978f',
  '#fd6660',
  '#e04b48',
  '#d03b3b',
  '#b21722',
  '#930415',
  '#71060f',
]
const pink: MantineColorsTuple = [
  '#fff1f4',
  '#ffdee6',
  '#ffbbce',
  '#fc92b2',
  '#f06a98',
  '#d55181',
  '#bd3b6d',
  '#a7245b',
  '#8c0b48',
  '#6e0236',
]
const gray: MantineColorsTuple = [
  '#f7faff',
  '#f0f4f9',
  '#e3e6ec',
  '#d1d4d9',
  '#b4b8bc',
  '#8d939a',
  '#6d7279',
  '#4e5359',
  '#31363c',
  '#171b20',
]

const FONT_FAMILY =
  "'Chiron GoRound TC', system-ui, -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif"

const theme = createTheme({
  fontFamily: FONT_FAMILY,
  headings: { fontFamily: FONT_FAMILY, fontWeight: '700' },
  colors: { blue, orange, teal, yellow, red, pink, gray },
  primaryColor: 'blue',
  primaryShade: 6,
  black: gray[9],
  defaultRadius: 'md',
  autoContrast: true,
  components: {
    Card: Card.extend({
      defaultProps: { radius: 'lg', bg: 'gray.0', shadow: 'xs' },
    }),
  },
})

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': gray[1],
    '--mantine-color-blue-light-color': blue[8],
  },
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
